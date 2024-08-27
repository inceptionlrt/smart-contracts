// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {InceptionAssetsHandler, IERC20, InceptionLibrary, Convert} from "../assets-handler/InceptionAssetsHandler.sol";

import {IStrategyManager, IStrategy} from "../interfaces/IStrategyManager.sol";
import {IDelegationManager} from "../interfaces/IDelegationManager.sol";
import {IEigenLayerHandler} from "../interfaces/IEigenLayerHandler.sol";
import {IInceptionRestaker} from "../interfaces/IInceptionRestaker.sol";

/// @author The InceptionLRT team
/// @title The EigenLayerHandler contract
/// @dev Serves communication with external EigenLayer protocol
/// @dev Specifically, this includes depositing, and handling withdrawal requests
contract EigenLayerHandler is InceptionAssetsHandler, IEigenLayerHandler {
    IStrategyManager public strategyManager;
    IStrategy public strategy;

    uint256 public epoch;

    /// @dev inception operator
    address internal _operator;

    /// @dev represents the pending amount to be redeemed by claimers,
    /// @notice + amount to undelegate from EigenLayer
    uint256 public totalAmountToWithdraw;

    /// @dev represents the amount pending processing until it is claimed
    /// @dev amount measured in asset
    uint256 internal _pendingWithdrawalAmount;

    IDelegationManager public delegationManager;

    Withdrawal[] public claimerWithdrawalsQueue;

    address internal constant _MOCK_ADDRESS =
        0x0000000000000000000000000012345000000000;

    /// @dev heap reserved for the claimers
    uint256 public redeemReservedAmount;

    /// @dev EigenLayer operator -> inception staker
    mapping(address => address) internal _operatorRestakers;
    address[] public restakers;

    uint256 public depositBonusAmount;

    /// @dev measured in percentage, MAX_TARGET_PERCENT - 100%
    uint256 public targetCapacity;

    uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;

    /// @dev constants are not stored in the storage
    uint256[50 - 13] private __reserver;

    modifier onlyOperator() {
        if (msg.sender != _operator) revert OnlyOperatorAllowed();
        _;
    }

    function __EigenLayerHandler_init(
        IStrategyManager _strategyManager,
        IStrategy _assetStrategy
    ) internal onlyInitializing {
        strategyManager = _strategyManager;
        strategy = _assetStrategy;

        __InceptionAssetsHandler_init(_assetStrategy.underlyingToken());
        // approve spending by strategyManager
        if (!_asset.approve(address(strategyManager), type(uint256).max))
            revert ApproveError();
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    /// @dev checks whether it's still possible to deposit into the strategy
    function _beforeDepositAssetIntoStrategy(uint256 amount) internal view {
        if (amount > getFreeBalance())
            revert InsufficientCapacity(totalAssets());

        (uint256 maxPerDeposit, uint256 maxTotalDeposits) = strategy
            .getTVLLimits();

        if (amount > maxPerDeposit)
            revert ExceedsMaxPerDeposit(maxPerDeposit, amount);

        uint256 currentBalance = _asset.balanceOf(address(strategy));
        if (currentBalance + amount > maxTotalDeposits)
            revert ExceedsMaxTotalDeposited(maxTotalDeposits, currentBalance);
    }

    /// @dev delegates assets held in the strategy to the EL operator.
    function _delegateToOperator(
        address restaker,
        address elOperator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) internal {
        IInceptionRestaker(restaker).delegateToOperator(
            elOperator,
            approverSalt,
            approverSignatureAndExpiry
        );
    }

    /*/////////////////////////////////
    ////// Withdrawal functions //////
    ///////////////////////////////*/

    /// @dev performs creating a withdrawal request from EigenLayer
    /// @dev requires a specific amount to withdraw
    function undelegateFrom(
        address elOperatorAddress,
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        address staker = _operatorRestakers[elOperatorAddress];
        if (staker == address(0)) revert OperatorNotRegistered();
        if (staker == _MOCK_ADDRESS) revert NullParams();

        IInceptionRestaker(staker).withdrawFromEL(_undelegate(amount, staker));
    }

    // /// @dev performs creating a withdrawal request from EigenLayer
    // /// @dev requires a specific amount to withdraw
    // function undelegateVault(
    //     uint256 amount
    // ) external whenNotPaused nonReentrant onlyOperator {
    //     address staker = address(this);

    //     uint256[] memory sharesToWithdraw = new uint256[](1);
    //     IStrategy[] memory strategies = new IStrategy[](1);

    //     sharesToWithdraw[0] = _undelegate(amount, staker);
    //     strategies[0] = strategy;
    //     IDelegationManager.QueuedWithdrawalParams[]
    //         memory withdrawals = new IDelegationManager.QueuedWithdrawalParams[](
    //             1
    //         );

    //     /// @notice from Vault
    //     withdrawals[0] = IDelegationManager.QueuedWithdrawalParams({
    //         strategies: strategies,
    //         shares: sharesToWithdraw,
    //         withdrawer: address(this)
    //     });
    //     delegationManager.queueWithdrawals(withdrawals);
    // }

    function _undelegate(
        uint256 amount,
        address staker
    ) internal returns (uint256) {
        uint256 nonce = delegationManager.cumulativeWithdrawalsQueued(staker);
        uint256 totalAssetSharesInEL = strategyManager.stakerStrategyShares(
            staker,
            strategy
        );
        uint256 shares = strategy.underlyingToSharesView(amount);
        amount = strategy.sharesToUnderlyingView(shares);

        // we need to withdraw the remaining dust from EigenLayer
        if (totalAssetSharesInEL < shares + 5) shares = totalAssetSharesInEL;

        _pendingWithdrawalAmount += amount;
        emit StartWithdrawal(
            staker,
            strategy,
            shares,
            uint32(block.number),
            delegationManager.delegatedTo(staker),
            nonce
        );
        return shares;
    }

    /// @dev claims completed withdrawals from EigenLayer, if they exist
    function claimCompletedWithdrawals(
        address restaker,
        IDelegationManager.Withdrawal[] calldata withdrawals
    ) public whenNotPaused nonReentrant {
        uint256 withdrawalsNum = withdrawals.length;
        IERC20[][] memory tokens = new IERC20[][](withdrawalsNum);
        uint256[] memory middlewareTimesIndexes = new uint256[](withdrawalsNum);
        bool[] memory receiveAsTokens = new bool[](withdrawalsNum);

        for (uint256 i = 0; i < withdrawalsNum; ++i) {
            tokens[i] = new IERC20[](1);
            tokens[i][0] = _asset;
            receiveAsTokens[i] = true;
        }

        uint256 availableBalance = getFreeBalance();

        uint256 withdrawnAmount;
        if (restaker == address(this)) {
            withdrawnAmount = _claimCompletedWithdrawalsForVault(
                withdrawals,
                tokens,
                middlewareTimesIndexes,
                receiveAsTokens
            );
        } else {
            if (!_restakerExists(restaker)) revert RestakerNotRegistered();
            withdrawnAmount = IInceptionRestaker(restaker).claimWithdrawals(
                withdrawals,
                tokens,
                middlewareTimesIndexes,
                receiveAsTokens
            );
        }

        emit WithdrawalClaimed(withdrawnAmount);

        _pendingWithdrawalAmount = _pendingWithdrawalAmount < withdrawnAmount
            ? 0
            : _pendingWithdrawalAmount - withdrawnAmount;

        if (_pendingWithdrawalAmount < 7) {
            _pendingWithdrawalAmount = 0;
        }

        _updateEpoch(availableBalance + withdrawnAmount);
    }

    function _claimCompletedWithdrawalsForVault(
        IDelegationManager.Withdrawal[] memory withdrawals,
        IERC20[][] memory tokens,
        uint256[] memory middlewareTimesIndexes,
        bool[] memory receiveAsTokens
    ) internal returns (uint256) {
        uint256 balanceBefore = _asset.balanceOf(address(this));

        delegationManager.completeQueuedWithdrawals(
            withdrawals,
            tokens,
            middlewareTimesIndexes,
            receiveAsTokens
        );

        // send tokens to the vault
        uint256 withdrawnAmount = _asset.balanceOf(address(this)) -
            balanceBefore;

        return withdrawnAmount;
    }

    function updateEpoch() external whenNotPaused {
        _updateEpoch(getFreeBalance());
    }

    /**
     * @dev let's calculate how many withdrawals we can cover with the withdrawnAmount
     * @dev #init state:
     * - balance of the vault: X
     * - epoch: means that the vault can handle the withdrawal queue up to the epoch index
     * withdrawalQueue[... : epoch];
     *
     * @dev #new state:
     * - balance of the vault: X + withdrawnAmount
     * - we need to recalculate a new value for epoch, new_epoch, to cover withdrawals:
     * withdrawalQueue[epoch : new_epoch];
     */
    function _updateEpoch(uint256 availableBalance) internal {
        uint256 withdrawalsNum = claimerWithdrawalsQueue.length;
        for (uint256 i = epoch; i < withdrawalsNum; ) {
            uint256 amount = claimerWithdrawalsQueue[i].amount;
            unchecked {
                if (amount > availableBalance) {
                    break;
                }
                redeemReservedAmount += amount;
                availableBalance -= amount;
                ++epoch;
                ++i;
            }
        }
    }

    function _restakerExists(
        address restakerAddress
    ) internal view returns (bool) {
        uint256 numOfRestakers = restakers.length;
        for (uint256 i = 0; i < numOfRestakers; ++i) {
            if (restakerAddress == restakers[i]) return true;
        }
        return false;
    }

    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    /// @dev returns the total deposited into asset strategy
    function getTotalDeposited() public view returns (uint256) {
        return
            getTotalDelegated() +
            totalAssets() +
            _pendingWithdrawalAmount -
            depositBonusAmount;
    }

    function getTotalDelegated() public view returns (uint256 total) {
        uint256 stakersNum = restakers.length;
        for (uint256 i = 0; i < stakersNum; ++i) {
            if (restakers[i] == address(0)) continue;
            total += strategy.userUnderlyingView(restakers[i]);
        }
        return total + strategy.userUnderlyingView(address(this));
    }

    function getFreeBalance() public view returns (uint256 total) {
        return
            getFlashCapacity() < _getTargetCapacity()
                ? 0
                : getFlashCapacity() - _getTargetCapacity();
    }

    function getPendingWithdrawalAmountFromEL()
        public
        view
        returns (uint256 total)
    {
        return _pendingWithdrawalAmount;
    }

    function getFlashCapacity() public view returns (uint256 total) {
        return totalAssets() - redeemReservedAmount - depositBonusAmount;
    }

    function _getTargetCapacity() internal view returns (uint256) {
        return (targetCapacity * getTotalDeposited()) / MAX_TARGET_PERCENT;
    }

    /*//////////////////////////
    ////// SET functions //////
    ////////////////////////*/

    function setDelegationManager(
        IDelegationManager newDelegationManager
    ) external onlyOwner {
        if (address(delegationManager) != address(0))
            revert DelegationManagerImmutable();

        emit DelegationManagerChanged(
            address(delegationManager),
            address(newDelegationManager)
        );
        delegationManager = newDelegationManager;
    }

    function setTargetFlashCapacity(
        uint256 newTargetCapacity
    ) external onlyOwner {
        emit TargetCapacityChanged(targetCapacity, newTargetCapacity);
        targetCapacity = newTargetCapacity;
    }

    function forceUndelegateRecovery(
        uint256 amount,
        address restaker
    ) external onlyOperator {
        if (restaker == address(0)) revert NullParams();
        for (uint256 i = 0; i < restakers.length; ++i) {
            if (
                restakers[i] == restaker &&
                !delegationManager.isDelegated(restakers[i])
            ) {
                restakers[i] == _MOCK_ADDRESS;
                break;
            }
        }
        _pendingWithdrawalAmount += amount;
    }
}

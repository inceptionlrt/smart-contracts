// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../assets-handler/InceptionAssetsHandler.sol";

import "../../interfaces/IStrategyManager.sol";
import "../../interfaces/IDelegationManager.sol";
import "../../interfaces/IEigenLayerHandler.sol";
import "../../interfaces/IInceptionRestaker.sol";

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

    /// @dev constants are not stored in the storage
    uint256[50 - 11] private __reserver;

    modifier onlyOperator() {
        require(
            msg.sender == _operator,
            "EigenLayerHandler: only operator allowed"
        );
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
        require(
            _asset.approve(address(strategyManager), type(uint256).max),
            "EigenLayerHandler: approve failed"
        );
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    /// @dev checks whether it's still possible to deposit into the strategy
    function _beforeDepositAssetIntoStrategy(uint256 amount) internal view {
        if (amount > totalAssets() - redeemReservedAmount) {
            revert InsufficientCapacity(totalAssets());
        }

        (uint256 maxPerDeposit, uint256 maxTotalDeposits) = strategy
            .getTVLLimits();

        if (amount > maxPerDeposit) {
            revert ExceedsMaxPerDeposit(maxPerDeposit, amount);
        }

        uint256 currentBalance = _asset.balanceOf(address(strategy));
        if (currentBalance + amount > maxTotalDeposits) {
            revert ExceedsMaxTotalDeposited(maxTotalDeposits, currentBalance);
        }
    }

    /// @dev deposits asset to the corresponding strategy
    function _depositAssetIntoStrategy(
        address restaker,
        uint256 amount
    ) internal {
        _asset.approve(restaker, amount);
        IInceptionRestaker(restaker).depositAssetIntoStrategy(amount);

        emit DepositedToEL(restaker, amount);
    }

    function depositAssetIntoStrategyFromVault(
        uint256 amount
    ) external nonReentrant onlyOperator {
        _beforeDepositAssetIntoStrategy(amount);

        strategyManager.depositIntoStrategy(strategy, _asset, amount);

        emit DepositedToEL(address(this), amount);
    }

    /// @dev deposits asset to the corresponding strategy
    function _depositAssetIntoStrategyFromVault(uint256 amount) internal {
        strategyManager.depositIntoStrategy(strategy, _asset, amount);
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

    function _delegateToOperatorFromVault(
        address elOperator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) internal {
        delegationManager.delegateTo(
            elOperator,
            approverSignatureAndExpiry,
            approverSalt
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
        address stakerAddress = _operatorRestakers[elOperatorAddress];
        if (stakerAddress == address(0)) {
            revert OperatorNotRegistered();
        }
        if (stakerAddress == _MOCK_ADDRESS) {
            revert NullParams();
        }

        uint256 nonce = delegationManager.cumulativeWithdrawalsQueued(
            stakerAddress
        );
        uint256 totalAssetSharesInEL = strategyManager.stakerStrategyShares(
            stakerAddress,
            strategy
        );
        uint256 shares = strategy.underlyingToSharesView(amount);
        // we need to withdraw the remaining dust from EigenLayer
        if (totalAssetSharesInEL < shares + 5) {
            shares = totalAssetSharesInEL;
        }
        amount = strategy.sharesToUnderlyingView(shares);

        emit StartWithdrawal(
            stakerAddress,
            strategy,
            shares,
            uint32(block.number),
            elOperatorAddress,
            nonce
        );

        _pendingWithdrawalAmount += amount;
        IInceptionRestaker(stakerAddress).withdrawFromEL(shares);
    }

    /// @dev performs creating a withdrawal request from EigenLayer
    /// @dev requires a specific amount to withdraw
    function undelegateVault(
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        address staker = address(this);
        uint256 nonce = delegationManager.cumulativeWithdrawalsQueued(staker);
        uint256 totalAssetSharesInEL = strategyManager.stakerStrategyShares(
            staker,
            strategy
        );
        uint256 shares = strategy.underlyingToSharesView(amount);
        // we need to withdraw the remaining dust from EigenLayer
        if (totalAssetSharesInEL < shares + 5) {
            shares = totalAssetSharesInEL;
        }
        amount = strategy.sharesToUnderlyingView(shares);

        uint256[] memory sharesToWithdraw = new uint256[](1);
        IStrategy[] memory strategies = new IStrategy[](1);

        strategies[0] = strategy;
        sharesToWithdraw[0] = shares;
        IDelegationManager.QueuedWithdrawalParams[]
            memory withdrawals = new IDelegationManager.QueuedWithdrawalParams[](
                1
            );

        withdrawals[0] = IDelegationManager.QueuedWithdrawalParams({
            strategies: strategies,
            shares: sharesToWithdraw,
            withdrawer: address(this)
        });

        _pendingWithdrawalAmount += amount;

        delegationManager.queueWithdrawals(withdrawals);

        emit StartWithdrawal(
            staker,
            strategy,
            shares,
            uint32(block.number),
            delegationManager.delegatedTo(staker),
            nonce
        );
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

        for (uint256 i = 0; i < withdrawalsNum; ) {
            tokens[i] = new IERC20[](1);
            tokens[i][0] = _asset;
            receiveAsTokens[i] = true;
            unchecked {
                i++;
            }
        }

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

        _updateEpoch();
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
        _updateEpoch();
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
    function _updateEpoch() internal {
        uint256 withdrawalsNum = claimerWithdrawalsQueue.length;
        uint256 availableBalance = totalAssets() - redeemReservedAmount;
        for (uint256 i = epoch; i < withdrawalsNum; ) {
            uint256 amount = claimerWithdrawalsQueue[i].amount;
            unchecked {
                if (amount > availableBalance) {
                    break;
                }
                redeemReservedAmount += amount;
                availableBalance -= amount;
                epoch++;
                i++;
            }
        }
    }

    function _restakerExists(
        address restakerAddress
    ) internal view returns (bool) {
        uint256 numOfRestakers = restakers.length;
        for (uint256 i = 0; i < numOfRestakers; ) {
            if (restakerAddress == restakers[i]) return true;
            unchecked {
                ++i;
            }
        }
        return false;
    }

    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    function getPendingWithdrawalAmountFromEL()
        public
        view
        returns (uint256 total)
    {
        return _pendingWithdrawalAmount;
    }

    /*//////////////////////////
    ////// SET functions //////
    ////////////////////////*/

    function setDelegationManager(
        IDelegationManager newDelegationManager
    ) external onlyOwner {
        emit DelegationManagerChanged(
            address(delegationManager),
            address(newDelegationManager)
        );
        delegationManager = newDelegationManager;
    }

    function forceUndelegateRecovery(
        uint256 amount,
        address restaker
    ) external onlyOperator {
        if (restaker == address(0)) revert NullParams();

        for (uint256 i = 0; i < restakers.length; ) {
            if (
                restakers[i] == restaker &&
                !delegationManager.isDelegated(restakers[i])
            ) {
                delete restakers[i];
                break;
            }
            unchecked {
                ++i;
            }
        }

        _pendingWithdrawalAmount += amount;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {InceptionAssetsHandler, IERC20, InceptionLibrary, Convert} from "../assets-handler/InceptionAssetsHandler.sol";

import {IStrategyManager, IStrategy} from "../interfaces/IStrategyManager.sol";
import {IDelegationManager} from "../interfaces/IDelegationManager.sol";
import {IEigenLayerHandler} from "../interfaces/IEigenLayerHandler.sol";
import {IInceptionRestaker} from "../interfaces/IInceptionRestaker.sol";

interface IMockStrategy {
    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external;
}

/// @author The InceptionLRT team
/// @title The EigenLayerHandler contract
/// @dev Serves communication with external EigenLayer protocol
/// @dev Specifically, this includes depositing, and handling withdrawal requests
abstract contract EigenLayerHandlerMock is InceptionAssetsHandler, IEigenLayerHandler {
    address public strategy;

    uint256 public epoch;

    /// @dev inception operator
    address internal _operator;

    /// @dev represents the pending amount to be redeemed by claimers,
    /// @notice + amount to undelegate from EigenLayer
    uint256 public totalAmountToWithdraw;

    /// @dev represents the amount pending processing until it is claimed
    /// @dev amount measured in asset
    uint256 internal _pendingWithdrawalAmount;

    Withdrawal[] public claimerWithdrawalsQueue;

    address internal constant _MOCK_ADDRESS =
        0x0000000000000000000000000012345000000000;

    /// @dev heap reserved for the claimers
    uint256 public redeemReservedAmount;

    // /// @dev EigenLayer operator -> inception staker
    // mapping(address => address) internal _operatorRestakers;
    // address[] public restakers;

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
        address _assetStrategy,
        IERC20 underlyingToken
    ) internal onlyInitializing {
        strategy = _assetStrategy;
        __InceptionAssetsHandler_init(underlyingToken);
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    /// @dev checks whether it's still possible to deposit into the strategy
    function _beforeDepositAssetIntoStrategy(uint256 amount) internal view {
        if (amount > getFreeBalance())
            revert InsufficientCapacity(totalAssets());
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
    function undelegateVault(
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        IMockStrategy(strategy).withdraw(amount);
        //emit WithdrawalClaimed(withdrawnAmount);
    }

    // /// @dev claims completed withdrawals from EigenLayer, if they exist
    // function claimCompletedWithdrawals(
    //     address restaker,
    //     IDelegationManager.Withdrawal[] calldata withdrawals
    // ) public whenNotPaused nonReentrant {


    //     _pendingWithdrawalAmount = _pendingWithdrawalAmount < withdrawnAmount
    //         ? 0
    //         : _pendingWithdrawalAmount - withdrawnAmount;

    //     if (_pendingWithdrawalAmount < 7) {
    //         _pendingWithdrawalAmount = 0;
    //     }

    //     _updateEpoch(availableBalance + withdrawnAmount);
    // }


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
        return total + _asset.balanceOf(strategy);
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

    function setTargetFlashCapacity(
        uint256 newTargetCapacity
    ) external onlyOwner {
        emit TargetCapacityChanged(targetCapacity, newTargetCapacity);
        targetCapacity = newTargetCapacity;
    }
}

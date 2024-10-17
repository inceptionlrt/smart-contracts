// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/math/Math.sol";

import {InceptionAssetsHandler, IERC20} from "../assets-handler/InceptionAssetsHandler.sol";

import {IDelegationManager} from "../interfaces/IDelegationManager.sol";
import {IEigenLayerHandler} from "../interfaces/IEigenLayerHandler.sol";
import {IInceptionRestaker} from "../interfaces/IInceptionRestaker.sol";
import {IMellowDepositWrapper} from "../interfaces/IMellowDepositWrapper.sol";
import {IMellowRestaker} from "../interfaces/IMellowRestaker.sol";

/// @author The InceptionLRT team
/// @title The MellowHandler contract
/// @dev Serves communication with external Mellow Protocol
/// @dev Specifically, this includes depositing, and handling withdrawal requests
contract MellowHandler is InceptionAssetsHandler, IEigenLayerHandler {
    uint256 public epoch;

    /// @dev inception operator
    address internal _operator;

    IMellowRestaker public mellowRestaker;

    /// @dev represents the pending amount to be redeemed by claimers,
    /// @notice + amount to undelegate from EigenLayer
    uint256 public totalAmountToWithdraw;

    Withdrawal[] public claimerWithdrawalsQueue;

    /// @dev heap reserved for the claimers
    uint256 public redeemReservedAmount;

    uint256 public depositBonusAmount;

    /// @dev measured in percentage, MAX_TARGET_PERCENT - 100%
    uint256 public targetCapacity;

    uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;

    //// TODO
    /// @dev constants are not stored in the storage
    uint256[50 - 15] private __reserver;

    modifier onlyOperator() {
        if (msg.sender != _operator) revert OnlyOperatorAllowed();
        _;
    }

    function __MellowHandler_init(
        IERC20 assetAddress,
        IMellowRestaker _mellowRestaker
    ) internal onlyInitializing {
        mellowRestaker = _mellowRestaker;

        __InceptionAssetsHandler_init(assetAddress);
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    /// @dev checks whether it's still possible to deposit into the strategy
    function _beforeDepositAssetIntoStrategy(uint256 amount) internal view {
        // _beforeDeposit(amount);
        // if (amount > maxPerDeposit)
        //     revert ExceedsMaxPerDeposit(maxPerDeposit, amount);
    }

    function _beforeDeposit(uint256 amount) internal view {
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

    function _depositAssetIntoMellow(uint256 amount) internal {
        _asset.approve(address(mellowRestaker), amount);
        uint256 lpAmount = mellowRestaker.delegateMellow(
            amount,
            0,
            block.timestamp
        );
    }

    /*/////////////////////////////////
    ////// Withdrawal functions //////
    ///////////////////////////////*/

    /// @dev performs creating a withdrawal request from Mellow Protocol
    /// @dev requires a specific amount to withdraw
    function undelegateFrom(
        address mellowVault,
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        amount = mellowRestaker.withdrawMellow(amount, true);
        emit StartMellowWithdrawal(address(mellowRestaker), amount);
        return;
    }

    // function _undelegate(
    //     uint256 amount,
    //     address staker
    // ) internal returns (uint256) {
    //     uint256 nonce = delegationManager.cumulativeWithdrawalsQueued(staker);
    //     uint256 totalAssetSharesInEL = strategyManager.stakerStrategyShares(
    //         staker,
    //         strategy
    //     );
    //     uint256 shares = strategy.underlyingToSharesView(amount);
    //     amount = strategy.sharesToUnderlyingView(shares);

    //     // we need to withdraw the remaining dust from EigenLayer
    //     if (totalAssetSharesInEL < shares + 5) shares = totalAssetSharesInEL;

    //     _pendingWithdrawalAmount += amount;
    //     emit StartWithdrawal(
    //         staker,
    //         strategy,
    //         shares,
    //         uint32(block.number),
    //         delegationManager.delegatedTo(staker),
    //         nonce
    //     );
    //     return shares;
    // }

    /// @dev claims completed withdrawals from Mellow Protocol, if they exist
    function claimCompletedWithdrawals(
        address mellowVault
    ) public whenNotPaused nonReentrant {
        uint256 availableBalance = getFreeBalance();

        uint256 withdrawnAmount = mellowRestaker
            .claimMellowWithdrawalCallback();

        emit WithdrawalClaimed(withdrawnAmount);

        _updateEpoch(availableBalance + withdrawnAmount);
    }

    // /// @dev claims completed withdrawals from Mellow, if they exist
    // function claimCompletedMellowWithdrawals(
    //     uint256 amount
    // ) public whenNotPaused nonReentrant {
    //     address restaker = _getRestaker(address(mellowVault));

    //     uint256 availableBalance = getFreeBalance();
    //     uint256 withdrawnAmount = IMellowRestaker(restaker)
    //         .claimMellowWithdrawalCallback(amount);
    //     emit WithdrawalClaimed(withdrawnAmount);

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
            getPendingWithdrawalAmountFromMellow() -
            depositBonusAmount;
    }

    function getTotalDelegated() public view returns (uint256 total) {
        return total + mellowRestaker.getDeposited();
    }

    function getFreeBalance() public view returns (uint256 total) {
        return
            getFlashCapacity() < _getTargetCapacity()
                ? 0
                : getFlashCapacity() - _getTargetCapacity();
    }

    /// @dev returns the total amount of pending withdrawals from Mellow LRT
    function getPendingWithdrawalAmountFromMellow()
        public
        view
        returns (uint256)
    {
        uint256 pendingWithdrawal = mellowRestaker.pendingWithdrawalAmount();
        uint256 claimableAmount = mellowRestaker.claimableAmount();
        return pendingWithdrawal + claimableAmount;
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

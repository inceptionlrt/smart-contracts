// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {InceptionAssetsHandler, IERC20} from "../assets-handler/InceptionAssetsHandler.sol";
import {IMellowHandler} from "../interfaces/symbiotic-vault/IMellowHandler.sol";
import {IIMellowRestaker} from "../interfaces/symbiotic-vault/IIMellowRestaker.sol";

/// @author The InceptionLRT team
/// @title The MellowHandler contract
/// @dev Serves communication with external Mellow Protocol
/// @dev Specifically, this includes depositing, and handling withdrawal requests
contract MellowHandler is InceptionAssetsHandler, IMellowHandler {
    uint256 public epoch;

    /// @dev inception operator
    address internal _operator;

    IIMellowRestaker public mellowRestaker;

    /// @dev represents the pending amount to be redeemed by claimers,
    /// @notice + amount to undelegate from Mellow
    uint256 public totalAmountToWithdraw;

    Withdrawal[] public claimerWithdrawalsQueue;

    /// @dev heap reserved for the claimers
    uint256 public redeemReservedAmount;

    uint256 public depositBonusAmount;

    /// @dev measured in percentage, MAX_TARGET_PERCENT - 100%
    uint256 public targetCapacity;

    uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;

    uint256[50 - 8] private __gap;

    modifier onlyOperator() {
        if (msg.sender != _operator) revert OnlyOperatorAllowed();
        _;
    }

    function __MellowHandler_init(
        IERC20 assetAddress,
        IIMellowRestaker _mellowRestaker
    ) internal onlyInitializing {
        mellowRestaker = _mellowRestaker;

        __InceptionAssetsHandler_init(assetAddress);
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    function _beforeDeposit(uint256 amount) internal view {
        if (amount > getFreeBalance())
            revert InsufficientCapacity(totalAssets());
    }

    function _depositAssetIntoMellow(
        uint256 amount,
        address mellowVault
    ) internal {
        _asset.approve(address(mellowRestaker), amount);
        mellowRestaker.delegateMellow(amount, 0, block.timestamp, mellowVault);
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
        amount = mellowRestaker.withdrawMellow(mellowVault, amount, true);
        emit StartMellowWithdrawal(address(mellowRestaker), amount);
        return;
    }

    /// @dev claims completed withdrawals from Mellow Protocol, if they exist
    function claimCompletedWithdrawals()
        public
        // address mellowVault
        whenNotPaused
        nonReentrant
    {
        uint256 availableBalance = getFreeBalance();

        uint256 withdrawnAmount = mellowRestaker
            .claimMellowWithdrawalCallback();

        emit WithdrawalClaimed(withdrawnAmount);

        _updateEpoch(availableBalance + withdrawnAmount);
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

    function getTotalDelegated() public view returns (uint256) {
        return mellowRestaker.getTotalDeposited();
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
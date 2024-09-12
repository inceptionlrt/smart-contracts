// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {InceptionAssetsHandler, IERC20, InceptionLibrary, Convert} from "../assets-handler/InceptionAssetsHandler.sol";

import {IEigenLayerHandler} from "../../interfaces/eigenlayer-vault/IEigenLayerHandler.sol";
import {IIMellowRestaker} from "../../interfaces/symbiotic-vault/IIMellowRestaker.sol";
import {IISymbioticRestaker} from "../../interfaces/symbiotic-vault/IISymbioticRestaker.sol";

import "hardhat/console.sol";

/// @author The InceptionLRT team
/// @title The SymbioticHandler contract
/// @dev Serves communication with external EigenLayer protocol
/// @dev Specifically, this includes depositing, and handling withdrawal requests
contract SymbioticHandler is InceptionAssetsHandler, IEigenLayerHandler {
    uint256 public epoch;

    /// @dev inception operator
    address internal _operator;

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

    IIMellowRestaker public mellowRestaker;

    IISymbioticRestaker public symbioticRestaker;

    /// TODO
    /// @dev constants are not stored in the storage
    /// TODO
    uint256[50 - 15] private __reserver;

    modifier onlyOperator() {
        if (msg.sender != _operator) revert OnlyOperatorAllowed();
        _;
    }

    function __SymbioticHandler_init() internal onlyInitializing {}

    /**
     **********************************************
     ******************* MELLOW *******************
     **********************************************/

    function delegateToMellow(uint256 amount) external nonReentrant {
        // _beforeDeposit(amount);
        _asset.approve(address(mellowRestaker), amount);
        uint256 lpAmount = mellowRestaker.delegateMellow(
            amount,
            0,
            block.timestamp
        );

        emit IEigenLayerHandler.DelegatedTo(
            address(0),
            address(mellowRestaker),
            amount
        );
        return;
    }

    /**
     * @dev performs creating a withdrawal request from EigenLayer
     * @dev requires a specific amount to withdraw
     */
    function undelegateMellow(
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        _fallback(mellowFacet);
    }

    /// @dev TODO
    function claimMellowWithdrawals() public whenNotPaused nonReentrant {
        uint256 availableBalance = getFreeBalance();
        uint256 withdrawnAmount = mellowRestaker
            .claimMellowWithdrawalCallback();

        // _pendingWithdrawalAmount = _pendingWithdrawalAmount < withdrawnAmount
        //     ? 0
        //     : _pendingWithdrawalAmount - withdrawnAmount;

        // if (_pendingWithdrawalAmount < 7) {
        //     _pendingWithdrawalAmount = 0;
        // }

        emit IEigenLayerHandler.WithdrawalClaimed(withdrawnAmount);

        _updateEpoch(availableBalance + withdrawnAmount);
    }

    function delegateToSymbiotic(uint256 amount) external nonReentrant {
        //_beforeDeposit(amount);
        _asset.approve(address(symbioticRestaker), amount);
        symbioticRestaker.delegate(amount);

        emit IEigenLayerHandler.DelegatedTo(
            address(0),
            address(mellowRestaker),
            amount
        );
    }

    /// @dev performs creating a withdrawal request from EigenLayer
    /// @dev requires a specific amount to withdraw
    function undelegateSymbiotic(
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        symbioticRestaker.undelegate(amount);
    }

    /**
     *************************************************
     ******************* SYMBIOTIC *******************
     *************************************************
     **/

    function claimSymbiotic() external whenNotPaused nonReentrant onlyOperator {
        uint256 availableBalance = getFreeBalance();

        symbioticRestaker.claim();

        console.log("claimed: ", getFreeBalance() - availableBalance);

        // _pendingWithdrawalAmount = _pendingWithdrawalAmount < withdrawnAmount
        //     ? 0
        //     : _pendingWithdrawalAmount - withdrawnAmount;

        // if (_pendingWithdrawalAmount < 7) {
        //     _pendingWithdrawalAmount = 0;
        // }

        // emit IEigenLayerHandler.WithdrawalClaimed(withdrawnAmount);

        // _updateEpoch(availableBalance + withdrawnAmount);
    }

    /**
     **********************************************
     ******************* GENERAL *******************
     **********************************************
     **/

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

    function updateEpoch() external whenNotPaused {
        _updateEpoch(getFreeBalance());
    }

    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    /// @dev returns the total deposited into Mellow + Symbiotic
    function getTotalDeposited() public view returns (uint256) {
        return totalAssets() - depositBonusAmount;
    }

    function getPendingWithdrawalAmountFromMellow()
        public
        view
        returns (uint256)
    {
        return
            mellowRestaker.pendingWithdrawalAmount() +
            mellowRestaker.claimableAmount();
    }

    function getFreeBalance() public view returns (uint256 total) {
        return
            getFlashCapacity() < _getTargetCapacity()
                ? 0
                : getFlashCapacity() - _getTargetCapacity();
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
        _fallback(setterFacet);
    }
}

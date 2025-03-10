// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {InceptionAssetsHandler, IERC20} from "../assets-handler/InceptionAssetsHandler.sol";
import {ISymbioticHandler} from "../interfaces/symbiotic-vault/ISymbioticHandler.sol";
import {IIMellowRestaker} from "../interfaces/symbiotic-vault/restakers/IIMellowRestaker.sol";
import {IISymbioticRestaker} from "../interfaces/symbiotic-vault/restakers/IISymbioticRestaker.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

/**
 * @title The SymbioticHandler contract
 * @author The InceptionLRT team
 * @dev Serves communication with external Protocol
 * @dev Specifically, this includes depositing, and handling withdrawal requests
 */
contract SymbioticHandler is InceptionAssetsHandler, ISymbioticHandler {
    using SafeERC20 for IERC20;

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

    IISymbioticRestaker public symbioticRestaker;

    uint256[50 - 9] private __gap;

    modifier onlyOperator() {
        require(msg.sender == _operator, OnlyOperatorAllowed());
        _;
    }

    function __SymbioticHandler_init(
        IERC20 assetAddress,
        IIMellowRestaker _mellowRestaker,
        IISymbioticRestaker _symbioticRestaker
    ) internal onlyInitializing {
        mellowRestaker = _mellowRestaker;
        symbioticRestaker = _symbioticRestaker;

        __InceptionAssetsHandler_init(assetAddress);
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    function _beforeDeposit(uint256 amount) internal view {
        uint256 freeBalance = getFreeBalance();
        if (amount > freeBalance) revert InsufficientCapacity(freeBalance);
    }

    function _depositAssetIntoMellow(
        uint256 amount,
        address mellowVault,
        address referral
    ) internal {
        _asset.safeIncreaseAllowance(address(mellowRestaker), amount);
        mellowRestaker.delegateMellow(amount, mellowVault, referral);
    }

    function _depositAssetIntoSymbiotic(
        uint256 amount,
        address vault
    ) internal {
        _asset.safeIncreaseAllowance(address(symbioticRestaker), amount);
        symbioticRestaker.delegate(vault, amount);
    }

    /*/////////////////////////////////
    ////// Withdrawal functions //////
    ///////////////////////////////*/

    /// @dev performs creating a withdrawal request from Mellow Protocol
    /// @dev requires a specific amount to withdraw
    function undelegateFromMellow(
        address mellowVault,
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        if (mellowVault == address(0)) revert InvalidAddress();
        if (amount == 0) revert ValueZero();
        amount = mellowRestaker.withdrawMellow(mellowVault, amount);
        emit StartMellowWithdrawal(address(mellowRestaker), amount);
        return;
    }

    /// @dev performs creating a withdrawal request from Symbiotic Protocol
    /// @dev requires a specific amount to withdraw
    function undelegateFromSymbiotic(
        address vault,
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        if (vault == address(0)) revert InvalidAddress();
        if (amount == 0) revert ValueZero();
        amount = symbioticRestaker.withdraw(vault, amount);

        emit StartSymbioticWithdrawal(address(symbioticRestaker), amount);
        return;
    }

    /// @dev claims completed withdrawals from Mellow Protocol, if they exist
    function claimCompletedWithdrawalsMellow()
        public
        onlyOperator
        whenNotPaused
        nonReentrant
    {
        uint256 availableBalance = getFreeBalance();

        uint256 withdrawnAmount = mellowRestaker
            .claimMellowWithdrawalCallback();

        emit WithdrawalClaimed(withdrawnAmount);

        _updateEpoch(availableBalance + withdrawnAmount);
    }

    function claimCompletedWithdrawalsSymbiotic(
        address vault,
        uint256 sEpoch
    ) public onlyOperator whenNotPaused nonReentrant {
        uint256 availableBalance = getFreeBalance();

        uint256 withdrawnAmount = symbioticRestaker.claim(vault, sEpoch);

        emit WithdrawalClaimed(withdrawnAmount);

        _updateEpoch(availableBalance + withdrawnAmount);
    }

    function updateEpoch() external onlyOperator whenNotPaused {
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
        uint256 redeemReservedBuffer;
        uint256 epochBuffer;
        for (uint256 i = epoch; i < withdrawalsNum; ) {
            uint256 amount = claimerWithdrawalsQueue[i].amount;
            unchecked {
                if (amount > availableBalance) {
                    break;
                }
                redeemReservedBuffer += amount;
                availableBalance -= amount;
                ++epochBuffer;
                ++i;
            }
        }
        redeemReservedAmount += redeemReservedBuffer;
        epoch += epochBuffer;
    }

    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    /// @dev returns the total deposited into asset strategy
    function getTotalDeposited() public view returns (uint256) {
        return
            getTotalDelegated() +
            totalAssets() +
            symbioticRestaker.pendingWithdrawalAmount() +
            getPendingWithdrawalAmountFromMellow() -
            depositBonusAmount;
    }

    function getTotalDelegated() public view returns (uint256) {
        return
            mellowRestaker.getTotalDeposited() +
            symbioticRestaker.getTotalDeposited();
    }

    function getFreeBalance() public view returns (uint256 total) {
        uint256 flashCapacity = getFlashCapacity();
        uint256 targetFlash = _getTargetCapacity();
        return flashCapacity < targetFlash ? 0 : flashCapacity - targetFlash;
    }

    /// @dev returns the total amount of pending withdrawals from Mellow LRT
    function getPendingWithdrawalAmountFromMellow()
        public
        view
        returns (uint256)
    {
        uint256 pendingWithdrawal = mellowRestaker.pendingWithdrawalAmount();
        uint256 mellowClaimable = mellowRestaker.claimableWithdrawalAmount();
        uint256 claimableAmount = mellowRestaker.claimableAmount();
        return pendingWithdrawal + claimableAmount + mellowClaimable;
    }

    function getFlashCapacity() public view returns (uint256 total) {
        uint256 _assets = totalAssets();
        uint256 _sum = redeemReservedAmount + depositBonusAmount;
        if (_sum > _assets) return 0;
        else return _assets - _sum;
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
        if (newTargetCapacity == 0) revert InvalidTargetFlashCapacity();
        if (newTargetCapacity >= MAX_TARGET_PERCENT) revert MoreThanMax();
        emit TargetCapacityChanged(targetCapacity, newTargetCapacity);
        targetCapacity = newTargetCapacity;
    }

    function setSymbioticRestaker(
        address newSymbioticRestaker
    ) external onlyOwner {
        require(newSymbioticRestaker != address(0), InvalidAddress());
        require(Address.isContract(newSymbioticRestaker), NotContract());

        symbioticRestaker = IISymbioticRestaker(newSymbioticRestaker);
        emit SymbioticRestakerAdded(newSymbioticRestaker);
    }

    function setMellowRestaker(
        address newMellowRestaker
    ) external onlyOwner {
        require(newMellowRestaker != address(0), InvalidAddress());
        require(Address.isContract(newMellowRestaker), NotContract());

        mellowRestaker = IIMellowRestaker(newMellowRestaker);
        emit MellowRestakerAdded(newMellowRestaker);
    }
}

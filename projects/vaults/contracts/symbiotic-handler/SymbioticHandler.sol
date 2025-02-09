// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {InceptionAssetsHandler, IERC20} from "../assets-handler/InceptionAssetsHandler.sol";
import {ISymbioticHandler} from "../interfaces/symbiotic-vault/ISymbioticHandler.sol";
import {IIMellowAdapter} from "../interfaces/adapters/IIMellowAdapter.sol";
import {IISymbioticAdapter} from "../interfaces/adapters/IISymbioticAdapter.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

/**
 * @title The SymbioticHandler contract
 * @author The InceptionLRT team
 * @dev Serves communication with external Mellow Protocol
 * @dev Specifically, this includes depositing, and handling withdrawal requests
 */
contract SymbioticHandler is InceptionAssetsHandler, ISymbioticHandler {
    using SafeERC20 for IERC20;

    uint256 public epoch;

    /// @dev inception operator
    address internal _operator;

    IIMellowAdapter public mellowAdapter;

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

    IISymbioticAdapter public symbioticAdapter;

    /// TODO
    uint256[50 - 9] private __gap;

    modifier onlyOperator() {
        require(msg.sender == _operator, OnlyOperatorAllowed());
        _;
    }

    function __SymbioticHandler_init(
        IERC20 assetAddress,
        IIMellowAdapter _mellowAdapter
    ) internal onlyInitializing {
        mellowAdapter = _mellowAdapter;

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
        uint256 deadline
    ) internal {
        _asset.safeIncreaseAllowance(address(mellowAdapter), amount);
        mellowAdapter.delegateMellow(amount, deadline, mellowVault);
    }

    function _depositAssetIntoSymbiotic(uint256 amount, address vault)
        internal
    {
        _asset.safeIncreaseAllowance(address(symbioticAdapter), amount);
        symbioticAdapter.delegate(vault, amount);
    }

    /*/////////////////////////////////
    ////// Withdrawal functions //////
    ///////////////////////////////*/

    /// @dev performs creating a withdrawal request from Mellow Protocol
    /// @dev requires a specific amount to withdraw
    function undelegateFromMellow(
        address mellowVault,
        uint256 amount,
        uint256 deadline
    ) external whenNotPaused nonReentrant onlyOperator {
        if (mellowVault == address(0)) revert InvalidAddress();
        if (amount == 0) revert ValueZero();
        amount = mellowAdapter.withdrawMellow(
            mellowVault,
            amount,
            deadline,
            true
        );
        emit StartMellowWithdrawal(address(mellowAdapter), amount);
        return;
    }

    /// @dev performs creating a withdrawal request from Mellow Protocol
    /// @dev requires a specific amount to withdraw
    function undelegateFromSymbiotic(address vault, uint256 amount)
        external
        whenNotPaused
        nonReentrant
        onlyOperator
    {
        if (vault == address(0)) revert InvalidAddress();
        if (amount == 0) revert ValueZero();
        amount = symbioticAdapter.withdraw(vault, amount);

        /// TODO
        emit StartMellowWithdrawal(address(symbioticAdapter), amount);
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

        uint256 withdrawnAmount = mellowAdapter
            .claimMellowWithdrawalCallback();

        emit WithdrawalClaimed(withdrawnAmount);

        _updateEpoch(availableBalance + withdrawnAmount);
    }

    function claimCompletedWithdrawalsSymbiotic(address vault, uint256 sEpoch)
        public
        onlyOperator
        whenNotPaused
        nonReentrant
    {
        uint256 availableBalance = getFreeBalance();

        uint256 withdrawnAmount = symbioticAdapter.claim(vault, sEpoch);

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
            symbioticAdapter.pendingWithdrawalAmount() +
            getPendingWithdrawalAmountFromMellow() -
            depositBonusAmount;
    }

    function getTotalDelegated() public view returns (uint256) {
        return
            mellowAdapter.getTotalDeposited() +
            symbioticAdapter.getTotalDeposited();
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
        uint256 pendingWithdrawal = mellowAdapter.pendingWithdrawalAmount();
        uint256 claimableAmount = mellowAdapter.claimableAmount();
        return pendingWithdrawal + claimableAmount;
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

    function setTargetFlashCapacity(uint256 newTargetCapacity)
        external
        onlyOwner
    {
        if (newTargetCapacity == 0) revert InvalidTargetFlashCapacity();
        if (newTargetCapacity >= MAX_TARGET_PERCENT) revert MoreThanMax();
        emit TargetCapacityChanged(targetCapacity, newTargetCapacity);
        targetCapacity = newTargetCapacity;
    }

    function setSymbioticAdapter(address newSymbioticAdapter)
        external
        onlyOwner
    {
        require(newSymbioticAdapter != address(0), InvalidAddress());
        require(Address.isContract(newSymbioticAdapter), NotContract());

        symbioticAdapter = IISymbioticAdapter(newSymbioticAdapter);
        emit SymbioticAdapterAdded(newSymbioticAdapter);
    }
}

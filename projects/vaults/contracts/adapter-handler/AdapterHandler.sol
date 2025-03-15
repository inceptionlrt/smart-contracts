// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/adapter-handler/IAdapterHandler.sol";

import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

import {IIBaseAdapter} from "../interfaces/adapters/IIBaseAdapter.sol";
import {IIMellowAdapter} from "../interfaces/adapters/IIMellowAdapter.sol";
import {IISymbioticAdapter} from "../interfaces/adapters/IISymbioticAdapter.sol";
import {IWithdrawalQueue} from "../interfaces/common/IWithdrawalQueue.sol";
import {InceptionAssetsHandler, IERC20} from "../assets-handler/InceptionAssetsHandler.sol";

/**
 * @title The AdapterHandler contract
 * @author The InceptionLRT team
 * @dev Serves communication with external Protocols
 * @dev Specifically, this includes depositing, and handling withdrawal requests
 */
contract AdapterHandler is InceptionAssetsHandler, IAdapterHandler {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @dev Deprecated variable representing the epoch (no longer in use).
     */
    uint256 private __deprecated_epoch;

    /**
     * @dev The address of the inception operator responsible for managing the contract.
     */
    address internal _operator;

    /**
     * @dev Instance of the Mellow adapter interface for interacting with Mellow-related functionality.
     */
    IIMellowAdapter private __deprecated_mellowAdapter;

    /**
     * @dev Deprecated variable representing the total amount pending to be redeemed by claimers.
     * @notice Previously included the amount to undelegate from Mellow.
     */
    uint256 private __deprecated_totalAmountToWithdraw;

    /**
     * @dev Deprecated array storing the queue of withdrawal requests from claimers.
     */
    __deprecated_Withdrawal[] private __deprecated_claimerWithdrawalsQueue;

    /**
     * @dev Deprecated variable representing the heap reserved for claimers' withdrawals.
     */
    uint256 private __deprecated_redeemReservedAmount;

    /**
     * @dev The bonus amount provided for deposits to incentivize staking.
     */
    uint256 public depositBonusAmount;

    /**
     * @dev The target capacity of the system, measured in percentage.
     * @notice Expressed as a value up to MAX_TARGET_PERCENT (100% = 100 * 1e18).
     */
    uint256 public targetCapacity;

    /**
     * @dev Constant representing the maximum target percentage (100%).
     * @notice Used as a reference for targetCapacity calculations, scaled to 1e18.
     */
    uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;

    /**
     * @dev Instance of the Symbiotic adapter interface for interacting with Symbiotic-related functionality.
     */
    IISymbioticAdapter private __deprecated_symbioticAdapter;

    /**
     * @dev Set of adapter addresses currently registered in the system.
     */
    EnumerableSet.AddressSet internal _adapters;

    /**
     * @dev Instance of the withdrawal queue interface for managing withdrawal requests.
     */
    IWithdrawalQueue public withdrawalQueue;

    /**
     * @dev Reserved storage gap to allow for future upgrades without shifting storage layout.
     * @notice Occupies 38 slots (50 total slots minus 12 used).
     */
    uint256[50 - 12] private __gap;

    modifier onlyOperator() {
        require(msg.sender == _operator, OnlyOperatorAllowed());
        _;
    }

    /**
     * @notice Initializes the AdapterHandler contract
     * @param assetAddress The address of the underlying asset token
     */
    function __AdapterHandler_init(
        IERC20 assetAddress
    ) internal onlyInitializing {
        __InceptionAssetsHandler_init(assetAddress);
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    /**
     * @notice Checks if the deposit amount is within available capacity
     * @param amount The amount to be deposited
     * @dev Reverts if amount exceeds free balance
     */
    function _beforeDeposit(uint256 amount) internal view {
        uint256 freeBalance = getFreeBalance();
        if (amount > freeBalance) revert InsufficientCapacity(freeBalance);
    }

    /**
     * @notice Delegates assets to a specific adapter and vault
     * @param adapter The address of the adapter to delegate to
     * @param vault The address of the vault to delegate to
     * @param amount The amount of assets to delegate
     * @param _data Additional data required for delegation
     * @dev Can only be called by the operator
     */
    function delegate(
        address adapter,
        address vault,
        uint256 amount,
        bytes[] calldata _data
    ) external nonReentrant whenNotPaused onlyOperator {
        _beforeDeposit(amount);

        if (adapter == address(0)) revert NullParams();
        if (!_adapters.contains(adapter)) revert AdapterNotFound();

        _asset.safeIncreaseAllowance(address(adapter), amount);
        IIBaseAdapter(adapter).delegate(vault, amount, _data);

        emit DelegatedTo(adapter, vault, amount);
    }

    /**
     * @notice Initiates undelegation from multiple adapters and vaults
     * @param adapters Array of adapter addresses
     * @param vaults Array of vault addresses
     * @param amounts Array of amounts to undelegate
     * @param _data Array of additional data required for undelegation
     * @dev Arrays must be of equal length
     */
    function undelegate(
        address[] calldata adapters,
        address[] calldata vaults,
        uint256[] calldata amounts,
        bytes[][] calldata _data
    ) external whenNotPaused nonReentrant onlyOperator {
        require(
            adapters.length == vaults.length &&
            vaults.length == amounts.length &&
            amounts.length == _data.length,
            ValueZero()
        );

        uint256 undelegatedEpoch = withdrawalQueue.currentEpoch();
        if (adapters.length == 0) {
            return _undelegateAndClaim(undelegatedEpoch);
        }

        uint256[] memory undelegatedAmounts = new uint256[](adapters.length);
        uint256[] memory claimedAmounts = new uint256[](adapters.length);

        for (uint256 i = 0; i < adapters.length; i++) {
            // undelegate adapter
            (undelegatedAmounts[i], claimedAmounts[i]) = _undelegate(
                adapters[i], vaults[i], amounts[i], _data[i], false
            );

            emit UndelegatedFrom(
                adapters[i], vaults[i], undelegatedAmounts[i], claimedAmounts[i], undelegatedEpoch
            );
        }

        // undelegate from queue
        withdrawalQueue.undelegate(
            undelegatedEpoch, adapters, vaults, undelegatedAmounts, claimedAmounts
        );
    }

    /**
     * @notice Internal function to handle undelegation from a single adapter
     * @param adapter The adapter address
     * @param vault The vault address
     * @param amount The amount to undelegate
     * @param _data Additional data required for undelegation
     * @param emergency Whether this is an emergency undelegation
     * @return undelegated Amount that was undelegated
     * @return claimed Amount that was claimed
     */
    function _undelegate(
        address adapter,
        address vault,
        uint256 amount,
        bytes[] calldata _data,
        bool emergency
    ) internal returns (uint256 undelegated, uint256 claimed) {
        if (!_adapters.contains(adapter)) revert AdapterNotFound();
        if (vault == address(0)) revert InvalidAddress();
        if (amount == 0) revert ValueZero();
        // undelegate from adapter
        return IIBaseAdapter(adapter).withdraw(vault, amount, _data, emergency);
    }

    /**
     * @notice Processes undelegation and claims for a specific epoch
     * @param undelegatedEpoch The epoch number to process
     */
    function _undelegateAndClaim(uint256 undelegatedEpoch) internal {
        uint256 requestedAmount = IERC4626(address(this)).convertToAssets(
            withdrawalQueue.getRequestedShares(undelegatedEpoch)
        );

        if (getFreeBalance() < requestedAmount) revert InsufficientFreeBalance();
        withdrawalQueue.forceUndelegateAndClaim(undelegatedEpoch, requestedAmount);
    }

    /**
     * @notice Initiates emergency undelegation from multiple adapters
     * @param adapters Array of adapter addresses
     * @param vaults Array of vault addresses
     * @param amounts Array of amounts to undelegate
     * @param _data Array of additional data required for undelegation
     */
    function emergencyUndelegate(
        address[] calldata adapters,
        address[] calldata vaults,
        uint256[] calldata amounts,
        bytes[][] calldata _data
    ) external whenNotPaused nonReentrant onlyOperator {
        require(
            adapters.length > 0 &&
            adapters.length == vaults.length &&
            vaults.length == amounts.length &&
            amounts.length == _data.length,
            ValueZero()
        );

        uint256 epoch = withdrawalQueue.EMERGENCY_EPOCH();
        for (uint256 i = 0; i < adapters.length; i++) {
            (uint256 undelegatedAmount,) = _undelegate(
                adapters[i], vaults[i], amounts[i], _data[i], true
            );

            emit UndelegatedFrom(
                adapters[i], vaults[i], undelegatedAmount, 0, epoch
            );
        }
    }

    /**
     * @notice Claims assets from multiple adapters for a specific epoch
     * @param epochNum The epoch number to claim for
     * @param adapters Array of adapter addresses
     * @param vaults Array of vault addresses
     * @param _data Array of additional data required for claiming
     */
    function claim(
        uint256 epochNum,
        address[] calldata adapters,
        address[] calldata vaults,
        bytes[][] calldata _data
    ) public onlyOperator whenNotPaused nonReentrant {
        require(adapters.length > 0 && adapters.length == vaults.length && vaults.length == _data.length, ValueZero());

        uint256[] memory claimedAmounts = new uint256[](adapters.length);
        for (uint256 i = 0; i < adapters.length; i++) {
            // claim from adapter
            claimedAmounts[i] = _claim(adapters[i], vaults[i], _data[i], false);
            emit ClaimedFrom(adapters[i], vaults[i], claimedAmounts[i], epochNum);
        }

        withdrawalQueue.claim(epochNum, adapters, vaults, claimedAmounts);
    }

    /**
     * @notice Claims assets in emergency mode from multiple adapters
     * @param adapters Array of adapter addresses
     * @param vaults Array of vault addresses
     * @param _data Array of additional data required for claiming
     */
    function emergencyClaim(
        address[] calldata adapters,
        address[] calldata vaults,
        bytes[][] calldata _data
    ) public onlyOperator whenNotPaused nonReentrant {
        require(adapters.length > 0 && adapters.length == vaults.length && vaults.length == _data.length, ValueZero());

        uint256 epoch = withdrawalQueue.EMERGENCY_EPOCH();
        for (uint256 i = 0; i < adapters.length; i++) {
            // claim from adapter
            uint256 claimedAmount = _claim(adapters[i], vaults[i], _data[i], true);
            emit ClaimedFrom(adapters[i], vaults[i], claimedAmount, epoch);
        }
    }

    /**
     * @notice Internal function to claim assets from a single adapter
     * @param adapter The adapter address
     * @param vault The vault address
     * @param _data Additional data required for claiming
     * @param emergency Whether this is an emergency claim
     * @return Amount of assets claimed
     */
    function _claim(address adapter, address vault, bytes[] calldata _data, bool emergency) internal returns (uint256) {
        if (!_adapters.contains(adapter)) revert AdapterNotFound();
        return IIBaseAdapter(adapter).claim(_data, emergency);
    }

    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    /**
     * @notice Returns the total amount deposited across all strategies
     * @return Total deposited amount including pending withdrawals and excluding bonus
     */
    function getTotalDeposited() public view returns (uint256) {
        return
            getTotalDelegated() +
            totalAssets() +
            getTotalPendingWithdrawals() -
            depositBonusAmount;
    }

    /**
     * @notice Returns the total amount delegated across all adapters
     * @return Total delegated amount
     */
    function getTotalDelegated() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < _adapters.length(); i++) {
            total += IIBaseAdapter(_adapters.at(i)).getTotalDeposited();
        }
        return total;
    }

    /**
     * @notice Returns the amount delegated to a specific adapter and vault
     * @param adapter The adapter address
     * @param vault The vault address
     * @return Amount delegated
     */
    function getDelegatedTo(
        address adapter,
        address vault
    ) external view returns (uint256) {
        return IIBaseAdapter(adapter).getDeposited(vault);
    }

    /**
     * @notice Returns the available balance for new deposits
     * @return total Available balance considering target capacity
     */
    function getFreeBalance() public view returns (uint256 total) {
        uint256 flashCapacity = getFlashCapacity();
        uint256 targetFlash = _getTargetCapacity();
        return flashCapacity < targetFlash ? 0 : flashCapacity - targetFlash;
    }

    /**
     * @notice Returns pending withdrawals for a specific adapter
     * @param adapter The adapter address
     * @return Amount of pending withdrawals
     */
    function getPendingWithdrawals(
        address adapter
    ) public view returns (uint256) {
        return IIBaseAdapter(adapter).inactiveBalance();
    }

    /**
     * @notice Returns total pending withdrawals across all adapters
     * @return Total amount of pending withdrawals
     */
    function getTotalPendingWithdrawals() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < _adapters.length(); i++) {
            total += IIBaseAdapter(_adapters.at(i)).inactiveBalance();
        }
        return total;
    }

    /**
     * @notice Returns total pending emergency withdrawals across all adapters
     * @return Total amount of emergency withdrawals
     */
    function getTotalPendingEmergencyWithdrawals() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < _adapters.length(); i++) {
            total += IIBaseAdapter(_adapters.at(i)).inactiveBalanceEmergency();
        }
        return total;
    }

    /**
     * @notice Returns the current flash capacity
     * @return total Available capacity for flash loans
     */
    function getFlashCapacity() public view returns (uint256 total) {
        uint256 _assets = totalAssets();
        uint256 _sum = redeemReservedAmount() + depositBonusAmount;
        if (_sum > _assets) return 0;
        else return _assets - _sum;
    }

    /**
     * @notice Calculates the target capacity based on total deposits
     * @return Target capacity amount
     */
    function _getTargetCapacity() internal view returns (uint256) {
        return (targetCapacity * getTotalDeposited()) / MAX_TARGET_PERCENT;
    }

    /**
     * @notice Returns the total shares pending withdrawal
     * @return Total shares to withdraw
     */
    function totalSharesToWithdraw() public view returns (uint256) {
        return withdrawalQueue.totalSharesToWithdraw();
    }

    /**
     * @notice Returns the amount reserved for redemptions
     * @return Reserved amount for redemptions
     */
    function redeemReservedAmount() public view returns (uint256) {
        return withdrawalQueue.totalAmountRedeem();
    }

    /*//////////////////////////
    ////// SET functions //////
    ////////////////////////*/

    /**
     * @notice Sets the target flash capacity percentage
     * @param newTargetCapacity New target capacity value (must be less than MAX_TARGET_PERCENT)
     */
    function setTargetFlashCapacity(
        uint256 newTargetCapacity
    ) external onlyOwner {
        if (newTargetCapacity == 0) revert InvalidTargetFlashCapacity();
        if (newTargetCapacity >= MAX_TARGET_PERCENT) revert MoreThanMax();
        emit TargetCapacityChanged(targetCapacity, newTargetCapacity);
        targetCapacity = newTargetCapacity;
    }

    /**
     * @notice Adds a new adapter to the system
     * @param adapter Address of the adapter to add
     */
    function addAdapter(address adapter) external onlyOwner {
        if (!Address.isContract(adapter)) revert NotContract();
        if (_adapters.contains(adapter)) revert AdapterAlreadyAdded();
        emit AdapterAdded(adapter);
        _adapters.add(adapter);
    }

    /**
     * @notice Removes an adapter from the system
     * @param adapter Address of the adapter to remove
     */
    function removeAdapter(address adapter) external onlyOwner {
        if (!Address.isContract(adapter)) revert NotContract();
        if (!_adapters.contains(adapter)) revert AdapterNotFound();
        emit AdapterRemoved(adapter);
        _adapters.remove(adapter);
    }
}

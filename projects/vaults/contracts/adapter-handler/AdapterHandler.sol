// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {InceptionAssetsHandler, IERC20} from "../assets-handler/InceptionAssetsHandler.sol";
import {IAdapterHandler} from "../interfaces/symbiotic-vault/ISymbioticHandler.sol";
import {IMellowAdapter} from "../interfaces/adapters/IMellowAdapter.sol";
import {ISymbioticAdapter} from "../interfaces/adapters/ISymbioticAdapter.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IBaseAdapter} from "../interfaces/adapters/IBaseAdapter.sol";

/**
 * @title The AdapterHandler contract
 * @author The InceptionLRT team
 * @dev Serves communication with external Protocols
 * @dev Specifically, this includes depositing, and handling withdrawal requests
 */
contract AdapterHandler is InceptionAssetsHandler, IAdapterHandler {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @notice Current epoch up to which withdrawals have been processed
    uint256 public epoch;

    /// @dev inception operator
    address internal _operator;

    /// @notice Reference to Mellow adapter
    IMellowAdapter public mellowAdapter;

    /// @dev represents the pending amount to be redeemed by claimers,
    /// @notice + amount to undelegate from Mellow
    uint256 public totalAmountToWithdraw;

    Withdrawal[] public claimerWithdrawalsQueue;

    /// @dev heap reserved for the claimers
    uint256 public redeemReservedAmount;

    /// @notice Accumulated bonus from deposits
    uint256 public depositBonusAmount;

    /// @dev measured in percentage, MAX_TARGET_PERCENT - 100%
    uint256 public targetCapacity;

    /// @notice Constant for 100% target percentage
    uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;

    /// @notice Reference to symbiotic adapter
    ISymbioticAdapter public symbioticAdapter;

    /// @dev Set of active adapter addresses
    EnumerableSet.AddressSet internal _adapters;

    /// @dev Storage gap for upgrades
    uint256[50 - 10] private __gap;

    /// @notice Modifier to restrict functions to operator only
    modifier onlyOperator() {
        require(msg.sender == _operator, OnlyOperatorAllowed());
        _;
    }

    /**
     * @notice Initializes the AdapterHandler with a specified ERC20 asset
     * @param assetAddress The ERC20 asset token address
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
     * @notice Checks available balance before deposit
     * @param amount Amount to deposit
     */
    function _beforeDeposit(uint256 amount) internal view {
        uint256 freeBalance = getFreeBalance();
        if (amount > freeBalance) revert InsufficientCapacity(freeBalance);
    }

    /**
     * @notice Delegates a deposit to an external adapter
     * @param adapter The adapter address
     * @param vault The vault address within the adapter
     * @param amount Amount to delegate
     * @param _data Additional data for adapter
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
        IBaseAdapter(adapter).delegate(vault, amount, _data);
        emit DelegatedTo(adapter, vault, amount);
    }

    /**
     * @notice Undelegates a deposit from an external adapter
     * @param adapter The adapter address
     * @param vault The vault address
     * @param amount Amount to undelegate
     * @param _data Additional data for adapter
     */
    function undelegate(
        address adapter,
        address vault,
        uint256 amount,
        bytes[] calldata _data
    ) external whenNotPaused nonReentrant onlyOperator {
        if (!_adapters.contains(adapter)) revert AdapterNotFound();
        if (vault == address(0)) revert InvalidAddress();
        if (amount == 0) revert ValueZero();

        amount = IBaseAdapter(adapter).withdraw(vault, amount, _data);

        emit UndelegatedFrom(adapter, vault, amount);
    }

    /**
     * @notice Claims available balance from the adapter
     * @param adapter The adapter address
     * @param _data Claim data for adapter
    */
    function claim(
        address adapter,
        bytes[] calldata _data
    ) public onlyOperator whenNotPaused nonReentrant {
        uint256 availableBalance = getFreeBalance();
        uint256 withdrawnAmount = IBaseAdapter(adapter).claim(_data);
        require(
            _getAssetWithdrawAmount(availableBalance + withdrawnAmount) >=
                getFreeBalance(),
            ClaimFailed()
        );

        emit WithdrawalClaimed(adapter, withdrawnAmount);

        _updateEpoch(availableBalance + withdrawnAmount);
    }

    /**
    * @notice Manually triggers epoch update based on current available balance
     */
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
            getTotalPendingWithdrawals() -
            depositBonusAmount;
    }

    /**
    * @notice Returns total amount delegated to all adapters
     * @return Total delegated amount
     */
    function getTotalDelegated() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < _adapters.length(); i++) {
            total += IBaseAdapter(_adapters.at(i)).getTotalDeposited();
        }
        return total;
    }

    /**
     * @notice Returns amount delegated to a specific vault on an adapter
     * @param adapter The adapter address
     * @param vault The vault address
     * @return Amount delegated
     */
    function getDelegatedTo(
        address adapter,
        address vault
    ) external view returns (uint256) {
        return IBaseAdapter(adapter).getDeposited(vault);
    }

    /**
     * @notice Gets the free (unallocated) balance in the vault
     * @return total Free balance available for new deposits
     */
    function getFreeBalance() public view returns (uint256 total) {
        uint256 flashCapacity = getFlashCapacity();
        uint256 targetFlash = _getTargetCapacity();
        return flashCapacity < targetFlash ? 0 : flashCapacity - targetFlash;
    }

    /// @dev returns the total amount of pending withdrawals
    function getPendingWithdrawals(
        address adapter
    ) public view returns (uint256) {
        return IBaseAdapter(adapter).inactiveBalance();
    }

    /**
     * @notice Gets total pending withdrawals across all adapters
     * @return Total pending withdrawal amount
     */
    function getTotalPendingWithdrawals() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < _adapters.length(); i++) {
            total += IBaseAdapter(_adapters.at(i)).inactiveBalance();
        }
        return total;
    }

    /**
     * @notice Calculates flash capacity (available liquidity buffer)
     * @return total Flash capacity value
     */
    function getFlashCapacity() public view returns (uint256 total) {
        uint256 _assets = totalAssets();
        uint256 _sum = redeemReservedAmount + depositBonusAmount;
        if (_sum > _assets) return 0;
        else return _assets - _sum;
    }

    /**
     * @notice Calculates target capacity in absolute terms
     * @return Target capacity based on configured percentage
     */
    function _getTargetCapacity() internal view returns (uint256) {
        return (targetCapacity * getTotalDeposited()) / MAX_TARGET_PERCENT;
    }

    /*//////////////////////////
    ////// SET functions //////
    ////////////////////////*/

    /**
     * @notice Sets the new flash loan target capacity
     * @param newTargetCapacity The new target capacity in percentage (1e18 precision)
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
     * @notice Adds a new adapter to the set of valid adapters
     * @param adapter The address of the adapter to add
     */
    function addAdapter(address adapter) external onlyOwner {
        if (!Address.isContract(adapter)) revert NotContract();
        if (_adapters.contains(adapter)) revert AdapterAlreadyAdded();
        emit AdapterAdded(adapter);
        _adapters.add(adapter);
    }

    /**
     * @notice Removes an existing adapter from the set
     * @param adapter The address of the adapter to remove
     */
    function removeAdapter(address adapter) external onlyOwner {
        if (!Address.isContract(adapter)) revert NotContract();
        if (!_adapters.contains(adapter)) revert AdapterNotFound();
        emit AdapterRemoved(adapter);
        _adapters.remove(adapter);
    }
}

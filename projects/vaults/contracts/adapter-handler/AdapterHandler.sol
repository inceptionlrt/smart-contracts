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

    uint256 public epoch;

    /// @dev inception operator
    address internal _operator;

    IMellowAdapter public mellowAdapter;

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

    ISymbioticAdapter public symbioticAdapter;

    EnumerableSet.AddressSet internal _adapters;

    uint256[50 - 10] private __gap;

    modifier onlyOperator() {
        require(msg.sender == _operator, OnlyOperatorAllowed());
        _;
    }

    function __AdapterHandler_init(
        IERC20 assetAddress
    ) internal onlyInitializing {
        __InceptionAssetsHandler_init(assetAddress);
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    function _beforeDeposit(uint256 amount) internal view {
        uint256 freeBalance = getFreeBalance();
        if (amount > freeBalance) revert InsufficientCapacity(freeBalance);
    }

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

    function getTotalDelegated() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < _adapters.length(); i++) {
            total += IBaseAdapter(_adapters.at(i)).getTotalDeposited();
        }
        return total;
    }

    function getDelegatedTo(
        address adapter,
        address vault
    ) external view returns (uint256) {
        return IBaseAdapter(adapter).getDeposited(vault);
    }

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

    function getTotalPendingWithdrawals() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < _adapters.length(); i++) {
            total += IBaseAdapter(_adapters.at(i)).inactiveBalance();
        }
        return total;
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

    function addAdapter(address adapter) external onlyOwner {
        if (!Address.isContract(adapter)) revert NotContract();
        if (_adapters.contains(adapter)) revert AdapterAlreadyAdded();
        emit AdapterAdded(adapter);
        _adapters.add(adapter);
    }

    function removeAdapter(address adapter) external onlyOwner {
        if (!Address.isContract(adapter)) revert NotContract();
        if (!_adapters.contains(adapter)) revert AdapterNotFound();
        emit AdapterRemoved(adapter);
        _adapters.remove(adapter);
    }
}

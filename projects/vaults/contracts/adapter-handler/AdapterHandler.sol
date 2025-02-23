// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../withdrawals/WithdrawalQueue.sol";

import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IAdapterHandler} from "../interfaces/symbiotic-vault/ISymbioticHandler.sol";
import {IIBaseAdapter} from "../interfaces/adapters/IIBaseAdapter.sol";
import {IIMellowAdapter} from "../interfaces/adapters/IIMellowAdapter.sol";
import {IISymbioticAdapter} from "../interfaces/adapters/IISymbioticAdapter.sol";
import {InceptionAssetsHandler, IERC20} from "../assets-handler/InceptionAssetsHandler.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IWithdrawalQueue} from "../interfaces/common/IWithdrawalQueue.sol";

import "hardhat/console.sol";

/**
 * @title The AdapterHandler contract
 * @author The InceptionLRT team
 * @dev Serves communication with external Protocols
 * @dev Specifically, this includes depositing, and handling withdrawal requests
 */
contract AdapterHandler is InceptionAssetsHandler, IAdapterHandler {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

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

    EnumerableSet.AddressSet internal _adapters;

    IWithdrawalQueue public withdrawalQueue;

    uint256[50 - 11] private __gap;

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
        IIBaseAdapter(adapter).delegate(vault, amount, _data);

        emit DelegatedTo(adapter, vault, amount);
    }

    function undelegate(
        address adapter,
        address vault,
        uint256 shares,
        bytes[] calldata _data
    ) external whenNotPaused nonReentrant onlyOperator {
        if (!_adapters.contains(adapter)) revert AdapterNotFound();
        if (vault == address(0)) revert InvalidAddress();
        if (shares == 0) revert ValueZero();

        uint256 amount = IERC4626(address(this)).convertToAssets(shares);
        // todo: withdraw from adapter should return undelegated and claim amounts
        amount = IIBaseAdapter(adapter).withdraw(vault, amount, _data);
        // todo: fix claimed amount
        uint256 epoch = withdrawalQueue.undelegate(adapter, shares, amount, 0);

        emit UndelegatedFrom(adapter, vault, amount, epoch);
    }

    function claim(
        uint256 epochNum,
        address adapter,
        bytes[] calldata _data
    ) public onlyOperator whenNotPaused nonReentrant {
        uint256 withdrawnAmount = IIBaseAdapter(adapter).claim(_data);
        withdrawalQueue.claim(adapter, epochNum, withdrawnAmount);

        emit WithdrawalClaimed(adapter, withdrawnAmount);
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
            total += IIBaseAdapter(_adapters.at(i)).getTotalDeposited();
        }
        return total;
    }

    function getDelegatedTo(
        address adapter,
        address vault
    ) external view returns (uint256) {
        return IIBaseAdapter(adapter).getDeposited(vault);
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
        return IIBaseAdapter(adapter).inactiveBalance();
    }

    function getTotalPendingWithdrawals() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < _adapters.length(); i++) {
            total += IIBaseAdapter(_adapters.at(i)).inactiveBalance();
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

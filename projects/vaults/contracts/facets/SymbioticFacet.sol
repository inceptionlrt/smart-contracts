// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import {BeaconProxy, Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import {IOwnable} from "../interfaces/IOwnable.sol";
import {IInceptionVault} from "../interfaces/IInceptionVault.sol";
import {IInceptionToken} from "../interfaces/IInceptionToken.sol";
import {IDelegationManager} from "../interfaces/IDelegationManager.sol";
import {ISymbioticVault} from "../interfaces/symbiotic/ISymbioticVault.sol";
import {ISymbioticRestaker} from "../interfaces/ISymbioticRestaker.sol";
import {IInceptionRatioFeed} from "../interfaces/IInceptionRatioFeed.sol";

import "../eigenlayer-handler/EigenLayerHandler.sol";

import {IInceptionVaultErrors} from "../interfaces/IInceptionVaultErrors.sol";

import "hardhat/console.sol";

contract SymbioticFacet is ReentrancyGuardUpgradeable, IInceptionVaultErrors {
    uint256[150] private __assetHandlerGap;

    IERC20 internal _asset;

    uint256[49] private __gap;

    IStrategyManager public strategyManager;
    IStrategy public strategy;

    uint256 public epoch;

    /// @dev inception operator
    address internal _operator;

    /// @dev represents the pending amount to be redeemed by claimers,
    /// @notice + amount to undelegate from EigenLayer
    uint256 public totalAmountToWithdraw;

    /// @dev represents the amount pending processing until it is claimed
    /// @dev amount measured in asset
    uint256 internal _pendingWithdrawalAmount;

    IDelegationManager public delegationManager;

    IEigenLayerHandler.Withdrawal[] public claimerWithdrawalsQueue;

    address internal constant _MOCK_ADDRESS =
        0x0000000000000000000000000012345000000000;

    /// @dev heap reserved for the claimers
    uint256 public redeemReservedAmount;

    /// @dev EigenLayer operator -> inception staker
    mapping(address => address) internal _operatorRestakers;
    address[] public restakers;

    uint256 public depositBonusAmount;

    /// @dev measured in percentage, MAX_TARGET_PERCENT - 100%
    uint256 public targetCapacity;

    uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;

    IMellowRestaker public mellowRestaker;
    ISymbioticRestaker public symbioticRestaker;

    /// @dev constants are not stored in the storage
    uint256[50 - 14] private __reserver;

    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    uint256 public minAmount;

    mapping(address => IEigenLayerHandler.Withdrawal)
        private _claimerWithdrawals;

    /// @dev the unique InceptionVault name
    string public name;

    /// @dev Factory variables
    address private _stakerImplementation;

    /**
     *  @dev Flash withdrawal params
     */

    /// @dev 100%
    uint64 public constant MAX_PERCENT = 100 * 1e8;

    IInceptionRatioFeed public ratioFeed;
    address public treasury;
    uint64 public protocolFee;

    /// @dev deposit bonus
    uint64 public maxBonusRate;
    uint64 public optimalBonusRate;
    uint64 public depositUtilizationKink;

    /// @dev flash withdrawal fee
    uint64 public maxFlashFeeRate;
    uint64 public optimalWithdrawalRate;
    uint64 public withdrawUtilizationKink;

    constructor() {}

    function _beforeDeposit(uint256 amount) internal view {
        if (amount > getFreeBalance())
            revert InsufficientCapacity(totalAssets());
    }

    function delegateToSymbiotic(uint256 amount) external nonReentrant {
        _beforeDeposit(amount);

        symbioticRestaker.delegate(amount);

        emit IEigenLayerHandler.DelegatedTo(
            address(0),
            address(mellowRestaker),
            amount
        );
    }

    function undelegateMellow(uint256 amount) external nonReentrant {
        amount = mellowRestaker.withdrawMellow(amount, true);
        emit IEigenLayerHandler.StartMellowWithdrawal(
            address(mellowRestaker),
            amount
        );
        return;
    }

    function claimMellowWithdrawals() external {
        uint256 availableBalance = getFreeBalance();
        uint256 withdrawnAmount = mellowRestaker
            .claimMellowWithdrawalCallback();

        _pendingWithdrawalAmount = _pendingWithdrawalAmount < withdrawnAmount
            ? 0
            : _pendingWithdrawalAmount - withdrawnAmount;

        if (_pendingWithdrawalAmount < 7) {
            _pendingWithdrawalAmount = 0;
        }

        emit IEigenLayerHandler.WithdrawalClaimed(withdrawnAmount);

        _updateEpoch(availableBalance + withdrawnAmount);
    }

    function _updateEpoch(uint256 availableBalance) internal {
        uint256 withdrawalsNum = claimerWithdrawalsQueue.length;
        for (uint256 i = epoch; i < withdrawalsNum; ) {
            uint256 amount = claimerWithdrawalsQueue[i].amount;
            console.log(amount, availableBalance);
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

    /// @dev returns the total deposited into asset strategy
    function getTotalDeposited() public view returns (uint256) {
        return
            getTotalDelegated() +
            totalAssets() +
            _pendingWithdrawalAmount -
            depositBonusAmount;
    }

    /// @dev returns the balance of iVault in the asset
    function totalAssets() public view returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    function getTotalDelegated() public view returns (uint256 total) {
        uint256 stakersNum = restakers.length;
        for (uint256 i = 0; i < stakersNum; ++i) {
            if (restakers[i] == address(0)) continue;
            total += strategy.userUnderlyingView(restakers[i]);
        }
        return total + strategy.userUnderlyingView(address(this));
        // sym.activeBalanceOf(address(this));
    }

    function _depositAssetIntoMellow(uint256 amount) internal {
        _asset.approve(address(mellowRestaker), amount);
        uint256 lpAmount = mellowRestaker.delegateMellow(
            amount,
            0,
            block.timestamp
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import {BeaconProxy, Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import {IOwnable} from "../interfaces/IOwnable.sol";
import {IInceptionVault} from "../interfaces/IInceptionVault.sol";
import {IInceptionToken} from "../interfaces/IInceptionToken.sol";
import {IDelegationManager} from "../interfaces/IDelegationManager.sol";
import {IInceptionRatioFeed} from "../interfaces/IInceptionRatioFeed.sol";
import "../eigenlayer-handler/EigenLayerHandler.sol";

import {IInceptionVaultErrors} from "../interfaces/IInceptionVaultErrors.sol";

import "hardhat/console.sol";

contract SetterFacet is ReentrancyGuardUpgradeable, IInceptionVaultErrors {
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

    address owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setProtocolFee(uint64 newProtocolFee) external {
        if (newProtocolFee >= MAX_PERCENT)
            revert ParameterExceedsLimits(newProtocolFee);

        emit IInceptionVault.ProtocolFeeChanged(protocolFee, newProtocolFee);
        protocolFee = newProtocolFee;
    }

    function setTreasuryAddress(address newTreasury) external {
        if (newTreasury == address(0)) revert NullParams();

        emit IInceptionVault.TreasuryChanged(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setMellowRestaker(IMellowRestaker newMellowRestaker) external {
        if (address(newMellowRestaker) == address(0)) revert NullParams();

        mellowRestaker = newMellowRestaker;
        _operatorRestakers[address(mellowRestaker)] = _MOCK_ADDRESS;

        emit IInceptionVault.MellowRestakerChanged(
            address(mellowRestaker),
            address(newMellowRestaker)
        );
    }

    function setRatioFeed(IInceptionRatioFeed newRatioFeed) external {
        if (address(newRatioFeed) == address(0)) revert NullParams();

        emit IInceptionVault.RatioFeedChanged(
            address(ratioFeed),
            address(newRatioFeed)
        );
        ratioFeed = newRatioFeed;
    }

    function setOperator(address newOperator) external {
        if (newOperator == address(0)) revert NullParams();

        emit IInceptionVault.OperatorChanged(_operator, newOperator);
        _operator = newOperator;
    }

    function setMinAmount(uint256 newMinAmount) external {
        emit IInceptionVault.MinAmountChanged(minAmount, newMinAmount);
        minAmount = newMinAmount;
    }

    function setName(string memory newVaultName) external {
        if (bytes(newVaultName).length == 0) revert NullParams();

        emit IInceptionVault.NameChanged(name, newVaultName);
        name = newVaultName;
    }

    function addELOperator(address newELOperator) external {
        if (!delegationManager.isOperator(newELOperator))
            revert NotEigenLayerOperator();

        if (_operatorRestakers[newELOperator] != address(0))
            revert EigenLayerOperatorAlreadyExists();

        _operatorRestakers[newELOperator] = _MOCK_ADDRESS;
        emit IInceptionVault.ELOperatorAdded(newELOperator);
    }

    function setDelegationManager(
        IDelegationManager newDelegationManager
    ) external {
        if (address(delegationManager) != address(0))
            revert DelegationManagerImmutable();

        emit IEigenLayerHandler.DelegationManagerChanged(
            address(delegationManager),
            address(newDelegationManager)
        );
        delegationManager = newDelegationManager;
    }

    function setTargetFlashCapacity(uint256 newTargetCapacity) external {
        emit IEigenLayerHandler.TargetCapacityChanged(
            targetCapacity,
            newTargetCapacity
        );
        targetCapacity = newTargetCapacity;
    }

    function setDepositBonusParams(
        uint64 newMaxBonusRate,
        uint64 newOptimalBonusRate,
        uint64 newDepositUtilizationKink
    ) external {
        if (newMaxBonusRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newMaxBonusRate);
        if (newOptimalBonusRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newOptimalBonusRate);
        if (newDepositUtilizationKink > MAX_PERCENT)
            revert ParameterExceedsLimits(newDepositUtilizationKink);

        maxBonusRate = newMaxBonusRate;
        optimalBonusRate = newOptimalBonusRate;
        depositUtilizationKink = newDepositUtilizationKink;

        emit IInceptionVault.DepositBonusParamsChanged(
            newMaxBonusRate,
            newOptimalBonusRate,
            newDepositUtilizationKink
        );
    }

    function setFlashWithdrawFeeParams(
        uint64 newMaxFlashFeeRate,
        uint64 newOptimalWithdrawalRate,
        uint64 newWithdrawUtilizationKink
    ) external {
        if (newMaxFlashFeeRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newMaxFlashFeeRate);
        if (newOptimalWithdrawalRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newOptimalWithdrawalRate);
        if (newWithdrawUtilizationKink > MAX_PERCENT)
            revert ParameterExceedsLimits(newWithdrawUtilizationKink);

        maxFlashFeeRate = newMaxFlashFeeRate;
        optimalWithdrawalRate = newOptimalWithdrawalRate;
        withdrawUtilizationKink = newWithdrawUtilizationKink;

        emit IInceptionVault.WithdrawFeeParamsChanged(
            newMaxFlashFeeRate,
            newOptimalWithdrawalRate,
            newWithdrawUtilizationKink
        );
    }
}

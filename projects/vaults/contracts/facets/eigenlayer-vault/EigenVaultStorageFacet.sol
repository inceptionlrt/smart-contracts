// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import {IEigenLayerHandler} from "../../interfaces/eigenlayer-vault/IEigenLayerHandler.sol";
import {IOwnable} from "../../interfaces/common/IOwnable.sol";
import {IInceptionVault_EL} from "../../interfaces/eigenlayer-vault/IInceptionVault_EL.sol";
import {IInceptionToken} from "../../interfaces/common/IInceptionToken.sol";
import {IDelegationManager} from "../../interfaces/eigenlayer-vault/eigen-core/IDelegationManager.sol";
import {IInceptionRatioFeed} from "../../interfaces/common/IInceptionRatioFeed.sol";

import {IIEigenRestaker, IIEigenRestakerErrors} from "../../interfaces/eigenlayer-vault/IIEigenRestaker.sol";

import "../../handlers/eigenlayer-handler/EigenLayerHandler.sol";

import {IInceptionVaultErrors} from "../../interfaces/common/IInceptionVaultErrors.sol";

contract EigenVaultStorageFacet is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
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

    /// @dev constants are not stored in the storage
    uint256[50 - 14] private __reserver;

    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    uint256 public minAmount;

    mapping(address => IEigenLayerHandler.Withdrawal)
        internal _claimerWithdrawals;

    /// @dev the unique InceptionVault name
    string public name;

    /// @dev Factory variables
    address internal _stakerImplementation;

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
}

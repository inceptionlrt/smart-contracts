// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IOwnable} from "../../interfaces/common/IOwnable.sol";
import {IInceptionVault_EL} from "../../interfaces/eigenlayer-vault/IInceptionVault_EL.sol";
import {IInceptionToken} from "../../interfaces/common/IInceptionToken.sol";
import {IDelegationManager} from "../../interfaces/eigenlayer-vault/eigen-core/IDelegationManager.sol";
import {IInceptionRatioFeed} from "../../interfaces/common/IInceptionRatioFeed.sol";

import {IInceptionVaultErrors} from "../../interfaces/common/IInceptionVaultErrors.sol";
import {IIEigenRestaker, IIEigenRestakerErrors} from "../../interfaces/eigenlayer-vault/IIEigenRestaker.sol";
import {IStrategyManager, IStrategy} from "../../interfaces/eigenlayer-vault/eigen-core/IStrategyManager.sol";

import {Convert} from "../../lib/Convert.sol";
import {InceptionLibrary} from "../../lib/InceptionLibrary.sol";

contract InceptionVaultStorage_EL is
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IInceptionVault_EL,
    IInceptionVaultErrors
{
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

    Withdrawal[] public claimerWithdrawalsQueue;

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

    address public eigenLayerFacet;
    address public userOperationFacet;
    address public setterFacet;

    /// @dev constants are not stored in the storage
    uint256[50 - 16] private __reserver;

    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    uint256 public minAmount;

    mapping(address => Withdrawal) internal _claimerWithdrawals;

    /// @dev the unique InceptionVault name
    string public name;

    /// @dev Factory variables
    address public stakerImplementation;

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

    function __InceptionAssetsHandler_init(
        IERC20 assetAddress
    ) internal onlyInitializing {
        __Pausable_init();
        __ReentrancyGuard_init();

        _asset = assetAddress;
    }

    /// @dev returns the total deposited into asset strategy
    function getTotalDeposited() public view returns (uint256) {
        return
            getTotalDelegated() +
            totalAssets() +
            _pendingWithdrawalAmount -
            depositBonusAmount;
    }

    function getTotalDelegated() public view returns (uint256 total) {
        uint256 stakersNum = restakers.length;
        for (uint256 i = 0; i < stakersNum; ++i) {
            if (restakers[i] == address(0)) continue;
            total += strategy.userUnderlyingView(restakers[i]);
        }
        return total + strategy.userUnderlyingView(address(this));
    }

    function getFreeBalance() public view returns (uint256 total) {
        return
            getFlashCapacity() < _getTargetCapacity()
                ? 0
                : getFlashCapacity() - _getTargetCapacity();
    }

    function getPendingWithdrawalAmountFromEL()
        public
        view
        returns (uint256 total)
    {
        return _pendingWithdrawalAmount;
    }

    function getFlashCapacity() public view returns (uint256 total) {
        return totalAssets() - redeemReservedAmount - depositBonusAmount;
    }

    function _getTargetCapacity() internal view returns (uint256) {
        return (targetCapacity * getTotalDeposited()) / MAX_TARGET_PERCENT;
    }

    /// @dev returns the address of the underlying token used for the vault for accounting, depositing, withdrawing.
    function asset() public view returns (address) {
        return address(_asset);
    }

    /// @dev returns the balance of iVault in the asset
    function totalAssets() public view returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    function _transferAssetFrom(address staker, uint256 amount) internal {
        if (!_asset.transferFrom(staker, address(this), amount))
            revert TransferAssetFromFailed(address(_asset));
    }

    function _transferAssetTo(address receiver, uint256 amount) internal {
        if (!_asset.transfer(receiver, amount))
            revert TransferAssetFailed(address(_asset));
    }

    function ratio() public view returns (uint256) {
        return ratioFeed.getRatioFor(address(inceptionToken));
    }

    /// @dev The functions below serve the proper withdrawal and claiming operations
    /// @notice Since a particular LST loses some wei on each transfer,
    /// this needs to be taken into account
    function _getAssetWithdrawAmount(
        uint256 amount
    ) internal view virtual returns (uint256) {
        return amount;
    }

    function _getAssetReceivedAmount(
        uint256 amount
    ) internal view virtual returns (uint256) {
        return amount;
    }

    function getDelegatedTo(
        address elOperator
    ) external view returns (uint256) {
        return strategy.userUnderlyingView(_operatorRestakers[elOperator]);
    }

    function getPendingWithdrawalOf(
        address claimer
    ) external view returns (uint256) {
        return _claimerWithdrawals[claimer].amount;
    }

    function isAbleToRedeem(
        address claimer
    ) public view returns (bool able, uint256[] memory) {
        // get the general request
        uint256 index;
        Withdrawal memory genRequest = _claimerWithdrawals[claimer];
        uint256[] memory availableWithdrawals = new uint256[](
            epoch - genRequest.epoch
        );
        if (genRequest.amount == 0) return (false, availableWithdrawals);

        for (uint256 i = 0; i < epoch; ++i) {
            if (claimerWithdrawalsQueue[i].receiver == claimer) {
                able = true;
                availableWithdrawals[index] = i;
                ++index;
            }
        }
        // decrease arrays
        if (availableWithdrawals.length - index > 0)
            assembly {
                mstore(availableWithdrawals, index)
            }

        return (able, availableWithdrawals);
    }

    function implementation() external view returns (address) {
        return stakerImplementation;
    }

    // @dev See {IERC4626-convertToShares}.
    function convertToShares(uint256 assets) public view returns (uint256) {
        return _convertToShares(assets);
    }

    function _convertToShares(
        uint256 assets
    ) internal view returns (uint256 shares) {
        return Convert.multiplyAndDivideFloor(assets, ratio(), 1e18);
    }

    // @dev See {IERC4626-convertToAssets}.
    function convertToAssets(uint256 shares) public view returns (uint256) {
        return _convertToAssets(shares);
    }

    function _convertToAssets(
        uint256 iShares
    ) public view returns (uint256 assets) {
        return Convert.multiplyAndDivideFloor(iShares, 1e18, ratio());
    }

    /*
     * @dev The `maxDeposit` function is used to calculate the maximum deposit.
     * @notice If the vault is locked or paused, users are not allowed to
     * deposit,
     * the maxDeposit is 0.
     * @return Amount of the maximum underlying assets deposit amount.
     */
    function maxDeposit(address) public view returns (uint256) {
        return !paused() ? type(uint256).max : 0;
    }

    /**
     * @dev The `maxMint` function is used to calculate the maximum amount of
     * shares you can mint.
     * @notice If the vault is locked or paused, the maxMint is 0.
     * @return Amount of the maximum shares mintable for the specified address.
     */
    function maxMint(address) public view returns (uint256) {
        return !paused() ? type(uint256).max : 0;
    }

    /**
     * @dev See {IERC4626-maxWithdraw}.
     * @notice If the function is called during the lock period the maxWithdraw
     * is `0`.
     * @return Amount of the maximum number of withdrawable underlying assets.
     */
    function maxWithdraw(address owner) public view returns (uint256) {
        return
            !paused()
                ? _convertToAssets(
                    IERC20(address(inceptionToken)).balanceOf(owner)
                )
                : 0;
    }

    /**
     * @dev See {IERC4626-maxRedeem}.
     * @notice If the function is called during the lock period the maxRedeem is
     * `0`;
     * @param owner The address of the owner.
     * @return Amount of the maximum number of redeemable shares.
     */
    function maxRedeem(address owner) public view returns (uint256) {
        return !paused() ? IERC20(address(inceptionToken)).balanceOf(owner) : 0;
    }

    /**
     * @dev See {IERC4626-previewDeposit}.
     */
    function previewDeposit(uint256 assets) public view returns (uint256) {
        return _convertToShares(assets);
    }

    /**
     * @dev See {IERC4626-previewMint}.
     */
    function previewMint(uint256 shares) public view returns (uint256) {
        return _convertToAssets(shares);
    }

    /**
     * @dev See {IERC4626-previewWithdraw}
     */
    function previewWithdraw(uint256 assets) public view returns (uint256) {
        return _convertToShares(assets);
    }

    /**
     * @dev See {IERC4626-previewRedeem}
     */
    function previewRedeem(uint256 shares) public view returns (uint256) {
        return _convertToAssets(shares);
    }

    /// @notice Function to calculate deposit bonus based on the utilization rate
    function calculateDepositBonus(
        uint256 amount
    ) public view returns (uint256) {
        return
            InceptionLibrary.calculateDepositBonus(
                amount,
                getFlashCapacity(),
                (_getTargetCapacity() * depositUtilizationKink) / MAX_PERCENT,
                optimalBonusRate,
                maxBonusRate,
                _getTargetCapacity()
            );
    }

    /// @dev Function to calculate flash withdrawal fee based on the utilization rate
    function calculateFlashWithdrawFee(
        uint256 amount
    ) public view returns (uint256) {
        uint256 capacity = getFlashCapacity();
        if (amount > capacity) revert InsufficientCapacity(capacity);

        return
            InceptionLibrary.calculateWithdrawalFee(
                amount,
                capacity,
                (_getTargetCapacity() * withdrawUtilizationKink) / MAX_PERCENT,
                optimalWithdrawalRate,
                maxFlashFeeRate,
                _getTargetCapacity()
            );
    }
}

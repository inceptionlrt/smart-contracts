// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

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

/**
 * @title InceptionVaultStorage_EL
 * @notice Manages the storage variables and getter functions for the Inception Vault, which interacts with EigenLayer and manages delegation, withdrawals, and rewards.
 * @dev This contract extends the Pausable, Ownable, and ReentrancyGuard patterns.
 * @author The InceptionLRT team
 */
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

    /// @dev Operator for the inception vault
    address internal _operator;

    /// @notice Represents the pending amount to be redeemed by claimers and to be undelegated from EigenLayer.
    uint256 public totalAmountToWithdraw;

    /// @dev Represents the amount pending processing until claimed.
    /// @notice Amount is measured in the vault's asset.
    uint256 internal _pendingWithdrawalAmount;

    IDelegationManager public delegationManager;

    Withdrawal[] public claimerWithdrawalsQueue;

    mapping(address => Withdrawal) internal _claimerWithdrawals;

    address internal constant _MOCK_ADDRESS =
        0x0000000000000000000000000012345000000000;

    /// @dev Reserved for claimers' withdrawal requests.
    uint256 public redeemReservedAmount;

    /// @dev Maps EigenLayer operators to Inception stakers.
    mapping(address => address) internal _operatorRestakers;
    address[] public restakers;

    uint256 public depositBonusAmount;

    /// @dev Target capacity for the vault, represented in percentage terms (max 100%).
    uint256 public targetCapacity;

    uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;

    address public eigenLayerFacet;
    address public erc4626Facet;
    address public setterFacet;

    /// @dev constants are not stored in the storage
    uint256[50 - 16] private __reserver;

    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    uint256 public minAmount;

    /// @dev Unique name of the InceptionVault.
    string public name;

    /// @dev Factory implementation address for creating stakers.
    address public stakerImplementation;

    // Flash withdrawal parameters
    /// @dev 100%
    uint64 public constant MAX_PERCENT = 100 * 1e8;

    IInceptionRatioFeed public ratioFeed;
    address public treasury;
    uint64 public protocolFee;

    uint64 public maxBonusRate;
    uint64 public optimalBonusRate;
    uint64 public depositUtilizationKink;

    uint64 public maxFlashFeeRate;
    uint64 public optimalWithdrawalRate;
    uint64 public withdrawUtilizationKink;

    uint256 public currentRewards;
    uint256 public startTimeline;
    uint256 public rewardsTimeline;

    mapping(bytes4 => FuncData) internal _selectorToTarget;

    /**
     * @notice Initializes the Inception Assets Handler
     * @dev This function is called during contract deployment.
     * @param assetAddress The address of the underlying ERC20 token.
     */
    function __InceptionVaultStorage_EL_init(
        IERC20 assetAddress
    ) internal onlyInitializing {
        __Pausable_init();
        __ReentrancyGuard_init();
        _asset = assetAddress;
    }

    /**
     * @notice Returns the total deposited amount in the vault strategy.
     * @return The total assets delegated, held in the vault, and pending withdrawal.
     */
    function getTotalDeposited() public view returns (uint256) {
        return
            getTotalDelegated() +
            totalAssets() +
            _pendingWithdrawalAmount -
            depositBonusAmount;
    }

    /**
     * @notice Returns the total amount delegated to all restakers in EigenLayer.
     * @return total The total delegated amount.
     */
    function getTotalDelegated() public view returns (uint256 total) {
        uint256 stakersNum = restakers.length;
        for (uint256 i = 0; i < stakersNum; ++i) {
            if (restakers[i] == address(0)) continue;
            total += strategy.userUnderlyingView(restakers[i]);
        }
        return total + strategy.userUnderlyingView(address(this));
    }

    /**
     * @notice Returns the available balance that can be used for flash withdrawals.
     * @return total The total free balance available for flash withdrawals.
     */
    function getFreeBalance() public view returns (uint256 total) {
        return
            getFlashCapacity() < _getTargetCapacity()
                ? 0
                : getFlashCapacity() - _getTargetCapacity();
    }

    /**
     * @notice Returns the amount pending withdrawal from EigenLayer.
     * @return total The pending withdrawal amount.
     */
    function getPendingWithdrawalAmountFromEL()
        public
        view
        returns (uint256 total)
    {
        return _pendingWithdrawalAmount;
    }

    function implementation() external view returns (address) {
        return stakerImplementation;
    }

    /**
     * @notice Returns the current vault-to-underlying token ratio from the InceptionRatioFeed.
     * @return The ratio used for converting between vault shares and assets.
     */
    function ratio() public view returns (uint256) {
        return ratioFeed.getRatioFor(address(inceptionToken));
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

    /**
     * @notice Checks if the given claimer is able to redeem any withdrawals.
     * @param claimer The address of the claimer.
     * @return able Indicates whether the claimer can redeem withdrawals.
     * @return availableWithdrawals The array of indices where the claimer has available withdrawals.
     */
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

    /*********************************************************************
     ****************************** ERC4626 ******************************
     *********************************************************************/

    /**
     * @notice Returns the address of the asset used in the vault.
     * @return The address of the underlying ERC20 token used for accounting, depositing, and withdrawing.
     */
    function asset() public view returns (address) {
        return address(_asset);
    }

    /**
     * @notice Returns the total assets held by the vault.
     * @return The total balance of the vault in the underlying asset.
     */
    function totalAssets() public view returns (uint256) {
        uint256 dayNum = (block.timestamp - startTimeline) / 1 days;
        uint256 totalDays = rewardsTimeline / 1 days;
        if (dayNum > totalDays) return _asset.balanceOf(address(this));

        uint256 reservedRewards = (currentRewards / totalDays) *
            (totalDays - dayNum);

        return (_asset.balanceOf(address(this)) - reservedRewards);
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

    /***********************************************************************
     ************************* FlashPool Functions *************************
     ***********************************************************************/

    /**
     * @notice Returns the flash withdrawal capacity.
     * @return total The total assets available for flash withdrawal.
     */
    function getFlashCapacity() public view returns (uint256 total) {
        return totalAssets() - redeemReservedAmount - depositBonusAmount;
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

    /// TODO
    function setSignature(
        bytes4 sig,
        FuncTarget _target,
        FuncAccess _access
    ) external onlyOwner {
        _selectorToTarget[sig] = FuncData({facet: _target, access: _access});
        //  emit SignatureSet(target, sig);
    }

    /*********************************************************************
     ************************* Internal function *************************
     *********************************************************************/

    /**
     * @notice Returns the target capacity based on the vault's configuration.
     * @dev This function calculates the vault's target capacity as a percentage of the total deposited amount.
     * @return The target capacity.
     */
    function _getTargetCapacity() internal view returns (uint256) {
        return (targetCapacity * getTotalDeposited()) / MAX_TARGET_PERCENT;
    }

    function _getSelectorToTarget(
        bytes4 sig
    ) internal view returns (address, FuncAccess) {
        _requireNotPaused();
        FuncData memory target = _selectorToTarget[sig];
        if (target.facet == FuncTarget.ERC4626_FACET) {
            return (erc4626Facet, target.access);
        }
        if (target.facet == FuncTarget.EIGEN_LAYER_FACET) {
            return (eigenLayerFacet, target.access);
        }
        if (target.facet == FuncTarget.SETTER_FACET) {
            return (setterFacet, target.access);
        }
        return (address(0), FuncAccess.EVERYONE);
    }

    function _verifyAccess(FuncAccess access) internal view {
        if (access == FuncAccess.ONLY_OWNER) {
            _checkOwner();
        } else if (access == FuncAccess.ONLY_OPERATOR) {
            if (msg.sender != _operator) revert OnlyOperatorAllowed();
        }
    }

    /**
     * @dev Internal function to transfer assets from the staker to the vault.
     * @param staker The address of the staker.
     * @param amount The amount to transfer.
     * @return The actual amount transferred.
     */
    function _transferAssetFrom(
        address staker,
        uint256 amount
    ) internal returns (uint256) {
        uint256 depositedBefore = _asset.balanceOf(address(this));

        if (!_asset.transferFrom(staker, address(this), amount))
            revert TransferAssetFromFailed(address(_asset));

        return _asset.balanceOf(address(this)) - depositedBefore;
    }

    /**
     * @dev Internal function to transfer assets from the vault to the receiver.
     * @param receiver The address to receive the assets.
     * @param amount The amount to transfer.
     */
    function _transferAssetTo(address receiver, uint256 amount) internal {
        if (!_asset.transfer(receiver, amount))
            revert TransferAssetFailed(address(_asset));
    }
}

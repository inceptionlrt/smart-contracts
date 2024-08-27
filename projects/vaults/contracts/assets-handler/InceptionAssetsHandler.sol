// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IInceptionAssetHandler} from "../interfaces/IInceptionAssetHandler.sol";
import {IInceptionVaultErrors} from "../interfaces/IInceptionVaultErrors.sol";

import {InceptionLibrary} from "../lib/InceptionLibrary.sol";
import {Convert} from "../lib/Convert.sol";

/// @author The InceptionLRT team
/// @title The InceptionAssetsHandler contract
/// @dev Handles operations with the corresponding asset
contract InceptionAssetsHandler is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    IInceptionVaultErrors,
    IInceptionAssetHandler
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;

    uint256 public currentRewards;

    /// @dev blockTime
    uint256 public startTimeline;

    /// @dev in days
    uint256 public rewardsTimeline;

    uint256[50 - 4] private __reserver;

    function __InceptionAssetsHandler_init(
        IERC20 assetAddress
    ) internal onlyInitializing {
        __Pausable_init();
        __ReentrancyGuard_init();

        _asset = assetAddress;
    }

    /// @dev returns the address of the underlying token used for the vault for accounting, depositing, withdrawing.
    function asset() public view returns (address) {
        return address(_asset);
    }

    /// @dev returns the balance of iVault in the asset
    function totalAssets() public view override returns (uint256) {
        uint256 dayNum = (block.timestamp - startTimeline) / 1 days;
        uint256 totalDays = rewardsTimeline / 1 days;
        if (dayNum > totalDays) return _asset.balanceOf(address(this));

        uint256 reservedRewards = (currentRewards / totalDays) *
            (totalDays - dayNum);

        return (_asset.balanceOf(address(this)) - reservedRewards);
    }

    function _transferAssetFrom(
        address staker,
        uint256 amount
    ) internal returns (uint256) {
        uint256 depositedBefore = totalAssets();

        if (!_asset.transferFrom(staker, address(this), amount))
            revert TransferAssetFromFailed(address(_asset));

        return totalAssets() - depositedBefore;
    }

    function _transferAssetTo(address receiver, uint256 amount) internal {
        if (!_asset.transfer(receiver, amount))
            revert TransferAssetFailed(address(_asset));
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
}

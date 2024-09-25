// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IInceptionAssetHandler.sol";
import "../interfaces/IInceptionVaultErrors.sol";

import "../lib/Convert.sol";

/// @author The InceptionLRT team
/// @title The InceptionERC20OmniAssetsHandler contract
/// @dev Handles operations with the corresponding asset (erc20 base token)
contract InceptionERC20OmniAssetsHandler is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    IInceptionVaultErrors,
    IInceptionAssetHandler
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;

    uint256[50] private __reserver;

    function __InceptionERC20OmniAssetsHandler_init(IERC20 assetAddress) internal onlyInitializing {
        __Pausable_init();
        __ReentrancyGuard_init();

        _asset = assetAddress;
    }

    /// @dev returns the address of the underlying token used for the vault for accounting, depositing, flash-withdrawing.
    function asset() public view returns (address) {
        return address(_asset);
    }

    /// @dev returns the balance of iVault in ETH
    function totalAssets() public view override returns (uint256) {
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

    /// @dev The functions below serve the proper withdrawal and claiming operations
    /// @notice Since ETH transfers do not lose wei on each transfer, these functions
    /// simply return the provided amount
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


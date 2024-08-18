// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IInceptionAssetHandler} from "../interfaces/IInceptionAssetHandler.sol";
import {IInceptionVaultErrors} from "../interfaces/IInceptionVaultErrors.sol";

import {InceptionLibrary} from "../lib/InceptionLibrary.sol";
import {Convert} from "../lib/Convert.sol";

import {InceptionFallbackHandler} from "../fallback-handler/InceptionFallbackHandler.sol";

/// @author The InceptionLRT team
/// @title The InceptionAssetsHandler contract
/// @dev Handles operations with the corresponding asset
contract InceptionAssetsHandler is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    IInceptionVaultErrors,
    IInceptionAssetHandler,
    InceptionFallbackHandler
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;

    address public eigenLayerFacet;
    address public userOperationFacet;
    address public setterFacet;
    address public mellowFacet;
    address public symbioticFacet;

    uint256[44] private __reserver;

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
    /// @notice Since a particular LST loses some wei on each transfer,
    /// this needs to be taken into account
    function _getAssetWithdrawAmount(
        uint256 amount
    ) internal view virtual returns (uint256) {
        return amount;
    }
}

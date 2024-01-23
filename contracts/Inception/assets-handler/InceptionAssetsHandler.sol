// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../../interfaces/IInceptionAssetHandler.sol";
import "../../interfaces/IInceptionErrors.sol";

import "../lib/Convert.sol";

/// @author The InceptionLRT team
/// @title The InceptionAssetsHandler contract
/// @dev Handles operations with the corresponding asset
contract InceptionAssetsHandler is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    IInceptionErrors,
    IInceptionAssetHandler
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;

    uint256[49] private __reserver;

    function __InceptionAssetsHandler_init(
        IERC20 assetAddress
    ) internal onlyInitializing {
        __Pausable_init();
        __ReentrancyGuard_init();

        _asset = assetAddress;
    }

    /// @dev returns the balance of iVault in the asset
    function totalAssets() public view override returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    function _transferAssetFrom(address staker, uint256 amount) internal {
        if (!_asset.transferFrom(staker, address(this), amount)) {
            revert TransferAssetFromFailed(address(_asset));
        }
    }

    function _transferAssetTo(address receiver, uint256 amount) internal {
        if (!_asset.transfer(receiver, amount)) {
            revert TransferAssetFailed(address(_asset));
        }
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

    function _getAssetRedeemAmount(
        uint256 amount
    ) internal view virtual returns (uint256) {
        return amount;
    }
}

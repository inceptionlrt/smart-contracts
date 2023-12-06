// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../../interfaces/IInceptionToken.sol";
import "../../interfaces/IDepositManager.sol";
import "../../interfaces/IDexRouter.sol";
import "../../interfaces/IInceptionAssetHandler.sol";
import "../../interfaces/IInceptionErrors.sol";

import "../lib/Convert.sol";

contract InceptionAssetsHandler is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    IInceptionErrors
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;

    uint256[49] private __reserver;

    function __InceptionAssetsHandler_init(
        IERC20 assetAddress
    ) internal onlyInitializing {
        _asset = assetAddress;
    }

    /// @dev returns assets and balance of iVault in them
    function totalAssets() public view returns (uint256) {
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

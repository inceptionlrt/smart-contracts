// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import {IInceptionAssetHandler} from "../interfaces/IInceptionAssetHandler.sol";
import {IInceptionVaultErrors} from "../interfaces/IInceptionVaultErrors.sol";

import {Convert} from "../lib/Convert.sol";

/// @author The InceptionLRT team
/// @title The InceptionOmniAssetsHandler contract
/// @dev Handles operations with the corresponding asset (native ETH)
contract InceptionOmniAssetsHandler is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    IInceptionVaultErrors,
    IInceptionAssetHandler
{
    address internal bridge;

    uint256[50] private __reserver;

    function __InceptionOmniAssetsHandler_init() internal onlyInitializing {
        __Pausable_init();
        __ReentrancyGuard_init();
    }

    /// @dev returns the balance of iVault in ETH
    function totalAssets() public view override returns (uint256) {
        return address(this).balance;
    }

    function _transferAssetTo(address receiver, uint256 amount) internal {
        (bool success, ) = receiver.call{value: amount}("");
        if (!success) {
            revert TransferAssetFailed(receiver);
        }
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

    function _getAssetRedeemAmount(
        uint256 amount
    ) internal view virtual returns (uint256) {
        return amount;
    }

    receive() external payable {}
}

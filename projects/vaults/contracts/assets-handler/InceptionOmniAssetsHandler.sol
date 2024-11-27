// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import {IInceptionOmniVault} from "../interfaces/IInceptionOmniVault.sol";
import {IInceptionAssetHandler} from "../interfaces/IInceptionAssetHandler.sol";

/// @author The InceptionLRT team
/// @title The InceptionOmniAssetsHandler contract
/// @dev Handles operations with the corresponding asset (native ETH)
contract InceptionOmniAssetsHandler is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    Ownable2StepUpgradeable,
    IInceptionOmniVault,
    IInceptionAssetHandler
{
    uint256[50] private __gap;

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
        if (!success) revert TransferAssetFailed();
    }

    receive() external payable {
        // emit
    }
}

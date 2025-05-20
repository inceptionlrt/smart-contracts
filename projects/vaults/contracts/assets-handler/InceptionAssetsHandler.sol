// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IInceptionVaultErrors} from "../interfaces/common/IInceptionVaultErrors.sol";

/**
 * @title The InceptionAssetsHandler contract
 * @author The InceptionLRT team
 * @dev Handles operations with the corresponding asset
 */
contract InceptionAssetsHandler is
PausableUpgradeable,
ReentrancyGuardUpgradeable,
Ownable2StepUpgradeable,
IInceptionVaultErrors
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;

    uint256 public currentRewards;
    /// @dev blockTime
    uint256 public startTimeline;
    /// @dev in seconds
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
    function totalAssets() public view returns (uint256) {
        uint256 elapsedDays = (block.timestamp - startTimeline) / 1 days;
        uint256 totalDays = rewardsTimeline / 1 days;
        if (elapsedDays > totalDays) return _asset.balanceOf(address(this));
        uint256 reservedRewards = (currentRewards / totalDays) * (totalDays - elapsedDays);
        return (_asset.balanceOf(address(this)) - reservedRewards);
    }

    function _transferAssetFrom(address staker, uint256 amount) internal {
        _asset.safeTransferFrom(staker, address(this), amount);
    }

    function _transferAssetTo(address receiver, uint256 amount) internal {
        _asset.safeTransfer(receiver, amount);
    }
}

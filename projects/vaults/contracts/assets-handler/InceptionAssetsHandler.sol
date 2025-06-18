// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IInceptionVaultErrors} from "../interfaces/common/IInceptionVaultErrors.sol";
import {IInceptionAssetsHandler} from "../interfaces/common/IInceptionAssetsHandler.sol";

/**
 * @title The InceptionAssetsHandler contract
 * @author The InceptionLRT team
 * @dev Handles operations with the corresponding asset
 */
contract InceptionAssetsHandler is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    Ownable2StepUpgradeable,
    IInceptionAssetsHandler,
    IInceptionVaultErrors
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;

    uint256 public currentRewards;
    /// @dev blockTime
    uint256 public startTimeline;
    /// @dev in seconds
    uint256 public rewardsTimeline;
    /// @dev Address of treasury which holds rewards.
    address public rewardsTreasury;

    uint256[50 - 5] private __reserver;

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
        uint256 reservedRewards = (currentRewards * (totalDays - elapsedDays)) / totalDays;
        return (_asset.balanceOf(address(this)) - reservedRewards);
    }

    /**
     * @notice Set rewards treasury address
     * @param treasury Address of the treasury which holds rewards
     */
    function setRewardsTreasury(address treasury) external onlyOwner {
        require(treasury != address(0), NullParams());

        emit SetRewardsTreasury(treasury);
        rewardsTreasury = treasury;
    }

    /**
     * @notice Updates the duration of the rewards timeline.
     * @dev The new timeline must be at least 1 day (86400 seconds)
     * @param newTimelineInSeconds The new duration of the rewards timeline, measured in seconds.
     */
    function setRewardsTimeline(uint256 newTimelineInSeconds) external onlyOwner {
        if (newTimelineInSeconds < 1 days || newTimelineInSeconds % 1 days != 0)
            revert InconsistentData();

        emit RewardsTimelineChanged(rewardsTimeline, newTimelineInSeconds);
        rewardsTimeline = newTimelineInSeconds;
    }
}

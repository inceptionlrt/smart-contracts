// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IInceptionAssetsHandler {
    /**
    * @dev Emitted when new rewards treasury set.
    * @param treasury The address of the new treasury.
    */
    event SetRewardsTreasury(address treasury);

    /**
     * @dev Emitted when rewards timeline changed.
     * @param rewardsTimeline new rewards timeline.
     * @param newTimelineInSeconds new rewards timeline in seconds.
     */
    event RewardsTimelineChanged(
        uint256 rewardsTimeline,
        uint256 newTimelineInSeconds
    );

    /**
    * @dev Emitted when rewards added to vault.
    * @param amount Amount of reward.
    * @param startTimeline timestamp of added rewards.
    */
    event RewardsAdded(uint256 amount, uint256 startTimeline);
}
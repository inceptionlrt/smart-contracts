// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IRestakerFacets.sol";

/**
 * @title Diamond-like implementation which support call with context (simple call).
 * @author InceptionLRT
 */
interface IRestaker {
    error RestakerCannotClaim();

    event Claimed(address indexed recipient, uint256 amount);
    event RewardCoordinatorChanged(address indexed rewardCoordinator, address indexed newRewardCoordinator);

    function initialize(address owner, IRestakerFacets facets) external;

    function __claim() external;
}

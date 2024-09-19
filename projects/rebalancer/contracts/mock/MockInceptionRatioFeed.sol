// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IInceptionRatioFeed.sol";

/// @title MockInceptionRatioFeed
/// @notice A mock version of the InceptionRatioFeed interface for testing purposes
contract MockInceptionRatioFeed is
    IInceptionRatioFeed,
    IInceptionRatioFeedErrors
{
    function updateRatioBatch(
        address[] calldata addresses,
        uint256[] calldata ratios
    ) external pure override {
        //just to make it compile
    }

    function getRatioFor(address) external pure override returns (uint256) {
        return 0.8 ether;
    }
}

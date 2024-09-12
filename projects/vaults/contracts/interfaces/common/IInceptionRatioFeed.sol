// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInceptionRatioFeed {
    function getRatioFor(address) external view returns (uint256);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @notice Balancer rate interface.
 */
interface IRateProvider {
    function getRate() external view returns (uint256);
}

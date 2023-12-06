// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IRebalanceStrategy {
    function rebalance(bytes calldata data) external returns (bool);
}

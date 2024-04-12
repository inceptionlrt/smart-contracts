// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRebalanceStrategy {
    function rebalance(bytes calldata data) external returns (bool);
}

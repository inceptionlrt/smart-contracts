// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMetaLRTStrategic {

    struct StrategyStats {
      uint256 allocation;  // in %
      address derivative;
      // TODO if we keep track of this token, how can we handle zircuit non certificate adapter ?
      // Because a rebalance might withdraw from zircuit and we need to keep track of wstETH in zircuit  
    }
}
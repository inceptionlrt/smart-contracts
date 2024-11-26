// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStrategyBase {
    function deposit(uint256 _amount) external virtual returns (uint256);
    function withdraw(uint256 _amount) external virtual returns (uint256);
    function totalStrategy() external virtual view returns (uint256);
    function totalStrategyETH() external virtual view returns (uint256);
}

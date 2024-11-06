// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IStrategyBase.sol";

abstract contract StrategyBase is IStrategyBase {

    address public metalrt;
    address public underlying;
    address public target;

    constructor(address _metalrt, address _underlying, address _target) {
        metalrt = _metalrt;
        underlying = _underlying;
        target = _target;
    }

    function deposit(uint256 _amount) external virtual returns (uint256);
    function withdraw(uint256 _amount) external virtual returns (uint256);
    function totalStrategy() external virtual view returns (uint256);
    function totalStrategyETH() external virtual view returns (uint256);
}
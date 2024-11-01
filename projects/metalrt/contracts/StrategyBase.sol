// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract StrategyBase {
    address public asset;
    address public target;

    constructor(address _asset, address _target) {
        asset = _asset;
        target = _target;
    }

    function deposit(uint256 _amount) external virtual returns (uint256);
    function withdraw(uint256 _amount) external virtual returns (uint256);
}
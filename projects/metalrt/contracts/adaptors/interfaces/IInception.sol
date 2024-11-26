// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IInception {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
}
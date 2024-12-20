// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface IGenericERC20Bridge {
    function bridge(uint256 amount) external returns (bool);
}
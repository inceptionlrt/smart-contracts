// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface IGenericERC20Bridge {
    function bridge(address receiver, uint256 amount) external;
}
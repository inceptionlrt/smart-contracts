// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWSteth is IERC20 {
    function wrap(uint256 stethAmount) external payable returns (uint256);

    function unwrap(uint256 wstethAmount) external returns (uint256);

    function getStETHByWstETH(
        uint256 wstethAmount
    ) external view returns (uint256);

    function getWstETHByStETH(
        uint256 stethAmount
    ) external view returns (uint256);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IrEth is IERC20 {
    // Calculate the amount of rETH backed by an amount of ETH
    function getRethValue(uint256 _ethAmount) external view returns (uint256);

    function getEthValue(uint256 _rethAmount) external view returns (uint256);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStEth is IERC20 {
    function sharesOf(address accounts) external returns (uint256);

    function getPooledEthByShares(
        uint256 _sharesAmount
    ) external view returns (uint256);

    function getSharesByPooledEth(
        uint256 _ethAmount
    ) external view returns (uint256);
}

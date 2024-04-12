// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract LsETH is ERC20Upgradeable {
    function underlyingBalanceFromShares(
        uint256 amount
    ) external view returns (uint256) {}
}

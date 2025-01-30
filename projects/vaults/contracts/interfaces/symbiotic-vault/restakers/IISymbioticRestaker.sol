// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IIBaseRestaker} from "./IIBaseRestaker.sol";

interface IISymbioticRestaker is IIBaseRestaker {
    event VaultAdded(address indexed vault);

    function delegate(uint256 amount, address vaultAddress)
        external
        returns (uint256 depositedAmount, uint256 mintedShares);

    function withdraw(address vaultAddress, uint256 amount)
        external
        returns (uint256);

    function claim(address vault, uint256 epoch) external returns (uint256);
}

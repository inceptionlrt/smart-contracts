// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IIBaseAdapter} from "./IIBaseAdapter.sol";

interface IISymbioticAdapter is IIBaseAdapter {
    error WithdrawalInProgress();

    error NothingToClaim();

    event VaultAdded(address indexed vault);

    function delegate(address vaultAddress, uint256 amount)
        external
        returns (uint256 depositedAmount, uint256 mintedShares);

    function withdraw(address vaultAddress, uint256 amount)
        external
        returns (uint256);

    function claim(address vaultAddress, uint256 epoch)
        external
        returns (uint256);
}

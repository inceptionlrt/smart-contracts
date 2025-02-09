// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IIBaseAdapter} from "./IIBaseAdapter.sol";

interface IISymbioticAdapter is IIBaseAdapter {
    error WithdrawalInProgress();

    error NothingToClaim();

    event VaultAdded(address indexed vault);

    function delegate(address vaultAddress, uint256 amount, bytes calldata _data)
        external
        returns (uint256 depositedAmount);

    function withdraw(address vaultAddress, uint256 amount, bytes calldata _data)
        external
        returns (uint256);

    function claim(bytes calldata _data)
        external
        returns (uint256);
}

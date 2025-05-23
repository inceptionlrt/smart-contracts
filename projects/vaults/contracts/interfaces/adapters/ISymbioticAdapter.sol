// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IBaseAdapter} from "./IBaseAdapter.sol";

interface ISymbioticAdapter is IBaseAdapter {
    error WithdrawalInProgress();

    error NothingToClaim();

    event VaultAdded(address indexed vault);

    event VaultRemoved(address indexed vault);

    event MintedShares(uint256 mintedShares);

    event BurnedAndMintedShares(uint256 burnedShares, uint256 mintedShares);
    
    error InvalidCollateral();

    error InvalidEpoch();

    error WrongEpoch();

    error AlreadyClaimed();
}

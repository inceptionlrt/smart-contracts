// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IInceptionBaseAdapter} from "./IInceptionBaseAdapter.sol";

interface IInceptionSymbioticAdapter is IInceptionBaseAdapter {
    error WithdrawalInProgress();

    error NothingToClaim();

    event VaultAdded(address indexed vault);

    event VaultRemoved(address indexed vault);

    error InvalidCollateral();

    error InvalidEpoch();

    error AlreadyClaimed();

    error WrongEpoch();

    event MintedShares(uint256 mintedShares);

    event BurnedAndMintedShares(uint256 burnedShares, uint256 mintedShares);

    event SymbioticWithdrawn(uint256 burnedShares, uint256 mintedShares, address claimer);
}

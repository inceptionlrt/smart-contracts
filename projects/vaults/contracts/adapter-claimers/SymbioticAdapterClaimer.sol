// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVault} from "../interfaces/symbiotic-vault/symbiotic-core/IVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IAdapterClaimer} from "../interfaces/adapter-claimer/IAdapterClaimer.sol";


/**
 * @title SymbioticAdapterClaimer
 * @author The InceptionLRT team
 * @notice Adapter claimer for Symbiotic Vaults
 * @notice In order to claim withdrawals multiple times
 * @dev This contract is used to claim rewards from Symbiotic Vaults
 */
contract SymbioticAdapterClaimer is IAdapterClaimer {
    address internal immutable _adapter;

    constructor(address asset) payable {
        _adapter = msg.sender;
        require(IERC20(asset).approve(_adapter, type(uint256).max), ApprovalFailed());
    }

    function claim(address vault, address recipient, uint256 epoch) external returns (uint256) {
        require(msg.sender == _adapter, OnlyAdapter());
        return IVault(vault).claim(recipient, epoch);
    }
}
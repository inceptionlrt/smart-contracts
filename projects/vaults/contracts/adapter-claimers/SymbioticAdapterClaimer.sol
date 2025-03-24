// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVault} from "../interfaces/symbiotic-vault/symbiotic-core/IVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SymbioticAdapterClaimer {
    address internal immutable adapter;

    constructor(address asset) {
        adapter = msg.sender;
        IERC20(asset).approve(adapter, type(uint256).max);
    }

    function claim(address vault, address recipient, uint256 epoch) external returns (uint256) {
        require(msg.sender == adapter);
        return IVault(vault).claim(recipient, epoch);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MellowAdapterClaimer {
    error OnlyAdapter();
    address internal immutable adapter;

    constructor(address asset) {
        adapter = msg.sender;
        IERC20(asset).approve(adapter, type(uint256).max);
    }

    function claim(address vault, address recipient, uint256 amount) external returns (uint256) {
        require(msg.sender == adapter, OnlyAdapter());
        return IMellowSymbioticVault(vault).claim(
            address(this), recipient, amount
        );
    }
}
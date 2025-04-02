// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";
import {IClaimer} from "../interfaces/symbiotic-vault/mellow-core/IClaimer.sol";

contract MellowV3AdapterClaimer {
    address internal immutable adapter;

    constructor(address asset) {
        adapter = msg.sender;
        IERC20(asset).approve(adapter, type(uint256).max);
    }

    function claim(
        address mellowClaimer,
        address multiVault,
        uint256[] calldata subvaultIndices,
        uint256[][] calldata indices,
        address recipient,
        uint256 maxAssets
    ) external returns (uint256) {
        require(msg.sender == adapter);
        return IClaimer(mellowClaimer).multiAcceptAndClaim(
            multiVault, subvaultIndices, indices, recipient, maxAssets
        );
    }
}
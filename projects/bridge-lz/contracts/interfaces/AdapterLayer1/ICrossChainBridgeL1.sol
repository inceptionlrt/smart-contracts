// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IAdapter} from "../IAdapter.sol";

interface ICrossChainBridgeL1 is IAdapter {
    event CrossChainInfoReceived(
        uint256 indexed chainId,
        uint256 timestamp,
        uint256 balance,
        uint256 totalSupply
    );
}

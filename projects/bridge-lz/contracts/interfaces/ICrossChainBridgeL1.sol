// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import { ICrossChainBridge } from "./ICrossChainBridge.sol";

interface ICrossChainBridgeL1 is ICrossChainBridge {
    // ======================= Events =======================

    event CrossChainInfoReceived(uint256 indexed chainId, uint256 timestamp, uint256 balance, uint256 totalSupply);

    // ======================= Errors =======================
    error FutureTimestamp();
}

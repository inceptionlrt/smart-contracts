// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ICrossChainBridgeL2} from "./AdapterLayer2/ICrossChainBridgeL2.sol";

interface IERC20CrossChainBridge is ICrossChainBridgeL2 {
    function sendTokens(uint256 amount) external;
    function quoteSendTokens(uint256 amount) external view returns (uint256);
}
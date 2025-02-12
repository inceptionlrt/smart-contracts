// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ICrossChainBridgeL2} from "./ICrossChainAdapterL2.sol";

interface IERC20CrossChainBridge is ICrossChainBridgeL2 {
    function sendTokens(uint256 amount) external returns (uint256); // return value = what was returned (dust, etc)
    function quoteSendTokens(uint256 amount) external view returns (uint256);
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ICrossChainBridgeL2} from "./ICrossChainAdapterL2.sol";

interface IFraxFerryERC20Bridge is ICrossChainBridgeL2 {
    function sendTokensViaFerry(uint256 amount) external;
    function quoteSendTokens(uint256 amount) external view returns (uint256);
}

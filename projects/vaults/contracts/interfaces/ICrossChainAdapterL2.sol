// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ICrossChainBridge} from "./ICrossChainBridge.sol";

interface ICrossChainBridgeL2 is ICrossChainBridge {
    function quote(
        bytes calldata _payload,
        bytes memory _options
    ) external view returns (uint256);

    function sendDataL1(
        bytes calldata _payload,
        bytes memory _options
    ) external payable;
}

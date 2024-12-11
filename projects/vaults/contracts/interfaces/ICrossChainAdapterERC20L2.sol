// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ICrossChainBridgeERC20} from "./ICrossChainBridgeERC20.sol";

interface ICrossChainBridgeERC20L2 is ICrossChainBridgeERC20 {
    function quote(
        bytes calldata _payload,
        bytes memory _options
    ) external view returns (uint256);

    function sendDataL1(
        bytes calldata _payload,
        bytes memory _options
    ) external payable returns (uint256);
}

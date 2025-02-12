// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IAdapter} from "../IAdapter.sol";

interface ICrossChainBridgeL2 is IAdapter {
    function quote(bytes calldata _payload, bytes memory _options)
        external
        view
        returns (uint256);

    function sendDataL1(bytes calldata _payload, bytes memory _options)
        external
        payable
        returns (uint256);
}

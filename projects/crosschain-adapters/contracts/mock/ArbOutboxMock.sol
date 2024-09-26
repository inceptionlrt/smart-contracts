// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@arbitrum/nitro-contracts/src/bridge/IBridge.sol";

contract ArbOutboxMock {
    address private sender;

    constructor(address _sender) {
        sender = _sender;
    }

    function setL2Sender(address _sender) external {
        sender = _sender;
    }

    function l2ToL1Sender() external view returns (address) {
        return sender;
    }
}
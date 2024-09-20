pragma solidity ^0.8.20;

import "@arbitrum/nitro-contracts/src/bridge/IBridge.sol";

contract ArbOutboxMock {
    address private sender;

    constructor(address __sender) {
        sender = __sender;
    }

    function l2ToL1Sender() external view returns (address) {
        return sender;
    }
}
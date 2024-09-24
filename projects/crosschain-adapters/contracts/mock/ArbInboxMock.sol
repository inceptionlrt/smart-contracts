pragma solidity ^0.8.20;

import "@arbitrum/nitro-contracts/src/bridge/IBridge.sol";

contract ArbInboxMock {
    address private _bridge;

    constructor(address __bridge) {
        _bridge = __bridge;
    }

    function bridge() external view returns (IBridge) {
        return IBridge(_bridge);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interface/ICrossChainAdapterL1.sol";

contract ArbBridgeMock {
    address payable public adapter;
    address public outbox;

    constructor(address payable _adapter, address _outbox) {
        adapter = _adapter;
        outbox = _outbox;
    }

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external {
        ICrossChainAdapterL1(adapter).receiveL2Info(
            _timestamp,
            _balance,
            _totalSupply
        );
    }

    receive() external payable {
        adapter.call{value: msg.value}("");
    }

    function activeOutbox() external view returns (address) {
        return outbox;
    }
}

pragma solidity ^0.8.20;

import "../interface/ICrossChainAdapterL1.sol";

contract OptBridgeMock {
    address private adapter;

    constructor(address _adapter) {
        adapter = _adapter;
    }

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external {
        ICrossChainAdapterL1(adapter).receiveL2Info(_timestamp, _balance, _totalSupply);
    }
}
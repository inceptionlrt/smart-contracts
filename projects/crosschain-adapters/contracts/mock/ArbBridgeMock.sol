pragma solidity ^0.8.20;

import "../interface/ICrossChainAdapter.sol";

contract ArbBridgeMock {

    address public adapter;
    address public outbox;

    constructor(address _adapter, address _outbox) {
        adapter = _adapter;
        outbox = _outbox;
    }

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external {
        ICrossChainAdapter(adapter).receiveL2Info(_timestamp, _balance, _totalSupply);
    }

    function activeOutbox() external view returns (address) {
        return outbox;
    }
}
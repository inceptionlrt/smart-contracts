// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./AbstractCrossChainAdapter.sol";

contract CrossChainAdapterOptimism is AbstractCrossChainAdapter {
    uint24 public constant OPTIMISM_CHAIN_ID = 10;

    constructor(
        address _transactionStorage
    ) AbstractCrossChainAdapter(_transactionStorage) {}

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external override nonReentrant {
        require(msg.sender == inbox, NotBridge());
        handleL2Info(OPTIMISM_CHAIN_ID, _timestamp, _balance, _totalSupply);
    }

    function receiveL2Eth() external payable override {
        require(msg.sender == inbox, NotBridge());
        emit L2EthDeposit(msg.value);
        (bool success, ) = rebalancer.call{value: msg.value}("");
        require(success, TransferToRebalancerFailed());
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./AbstractCrossChainAdapter.sol";

contract CrossChainAdapterOptimism is AbstractCrossChainAdapter {
    address public inboxOptimism;
    uint24 public constant OPTIMISM_CHAIN_ID = 10;

    constructor(
        address _transactionStorage
    ) AbstractCrossChainAdapter(_transactionStorage) {}

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external override {
        require(msg.sender == inboxOptimism, "Not Bridge");
        handleL2Info(OPTIMISM_CHAIN_ID, _timestamp, _balance, _totalSupply);
    }

    function setInboxOptimism(address _inbox) external onlyOwner {
        require(_inbox != address(0), "Setting zero address");
        inboxOptimism = _inbox;
    }

    function updateL2Target(address _l2Target) external override onlyOwner {
        require(_l2Target != address(0), "Setting zero address");
        l2Target = _l2Target;
    }

    function setRebalancer(address _rebalancer) external override onlyOwner {
        require(_rebalancer != address(0), "Setting zero address");
        rebalancer = _rebalancer;
    }

    function receiveL2Eth() external payable override {
        emit L2EthDeposit(msg.value);
        (bool success, ) = rebalancer.call{value: msg.value}("");
        require(success, "Transfer to Rebalancer failed");
    }
}

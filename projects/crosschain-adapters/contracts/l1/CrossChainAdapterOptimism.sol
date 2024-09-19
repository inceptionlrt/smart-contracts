// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./AbstractCrossChainAdapter.sol";

contract CrossChainBridgeArbitrum is AbstractCrossChainAdapter {
    address public inboxArbitrum;
    uint24 public constant ARBITRUM_CHAIN_ID = 42161;

    uint32[] private chainIds;

    constructor(
        address _transactionStorage
    ) AbstractCrossChainAdapter(_transactionStorage) {}

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external override {
        require(msg.sender == inboxArbitrum, "Not Bridge");
        handleL2Info(ARBITRUM_CHAIN_ID, _timestamp, _balance, _totalSupply);
    }

    function setInboxArbitrum(address _inbox) external onlyOwner {
        require(_inbox != address(0), "Setting zero address");
        inboxArbitrum = _inbox;
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

    function addChainId(uint32 newChainId) external onlyOwner {
        for (uint i = 0; i < chainIds.length; i++) {
            if (chainIds[i] == newChainId) {
                revert("Chain ID already exists");
            }
        }
        chainIds.push(newChainId);
    }

    function getAllChainIds() external view returns (uint32[] memory) {
        return chainIds;
    }
}

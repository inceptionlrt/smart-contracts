// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@arbitrum/nitro-contracts/src/bridge/IInbox.sol";
import "@arbitrum/nitro-contracts/src/bridge/IOutbox.sol";

import "./AbstractCrossChainAdapter.sol";

contract CrossChainAdapterArbitrum is AbstractCrossChainAdapter {
    uint24 public constant ARBITRUM_CHAIN_ID = 42161;
    uint256 maxSubmissionCost = 100000000000;
    uint256 maxGas = 100000000000;
    uint256 gasPriceBid = 1000;

    event GasParametersChanged(
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    );

    constructor(
        address _transactionStorage
    ) AbstractCrossChainAdapter(_transactionStorage) {}

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external override nonReentrant {
        IBridge bridge = IInbox(inbox).bridge();
        require(msg.sender == address(bridge), NotBridge());
        IOutbox outbox = IOutbox(bridge.activeOutbox());
        address actualSender = outbox.l2ToL1Sender();
        require(actualSender == l2Sender, NotAuthorizedByL2());

        handleL2Info(ARBITRUM_CHAIN_ID, _timestamp, _balance, _totalSupply);
    }

    function receiveL2Eth() external payable override {
        IBridge bridge = IInbox(inbox).bridge();
        require(msg.sender == address(bridge), NotBridge());
        require(rebalancer != address(0), RebalancerNotSet());
        Address.sendValue(payable(rebalancer), msg.value);
        emit L2EthDeposit(msg.value);
    }

    function sendEthToL2() external payable {
        IInbox _inbox = IInbox(inbox);
        _inbox.createRetryableTicket{value: msg.value}(
            l2Sender,
            0,
            maxSubmissionCost,
            msg.sender, // Refund unused gas to this address
            msg.sender, // Refund unused ETH to this address
            maxGas,
            gasPriceBid,
            "" // Data (empty since only sending ETH)
        );
    }

    function setGasParameters(
        uint256 _maxSubmissionCost,
        uint256 _maxGas,
        uint256 _gasPriceBid
    ) external onlyOwner {
        require(
            _maxSubmissionCost > 0 && _maxGas > 0 && _gasPriceBid > 0,
            CannotSetZero()
        );
        maxSubmissionCost = _maxSubmissionCost;
        maxGas = _maxGas;
        gasPriceBid = _gasPriceBid;
        emit GasParametersChanged(_maxSubmissionCost, _maxGas, _gasPriceBid);
    }
}

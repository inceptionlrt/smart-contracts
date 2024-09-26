// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@arbitrum/nitro-contracts/src/bridge/IInbox.sol";
import "@arbitrum/nitro-contracts/src/bridge/IOutbox.sol";

import "./AbstractCrossChainAdapterL1.sol";

contract CrossChainAdapterArbitrumL1 is AbstractCrossChainAdapterL1 {
    IInbox public inbox;
    uint24 public constant ARBITRUM_CHAIN_ID = 42161;

    event GasParametersChanged(
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    );

    event RetryableTicketCreated(uint256 indexed ticketId);

    event InboxChanged(address newInbox);

    constructor(
        address _transactionStorage
    ) AbstractCrossChainAdapterL1(_transactionStorage) {}

    function getChainId() external pure override returns (uint24) {
        return ARBITRUM_CHAIN_ID;
    }

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external override nonReentrant {
        IBridge bridge = IInbox(inbox).bridge();
        require(msg.sender == address(bridge), NotBridge());
        IOutbox outbox = IOutbox(bridge.activeOutbox());
        address actualSender = outbox.l2ToL1Sender();
        require(actualSender == l2Sender, UnauthorizedOriginalSender());

        handleL2Info(ARBITRUM_CHAIN_ID, _timestamp, _balance, _totalSupply);
    }

    function sendEthToL2(
        uint256 callValue,
        bytes[] calldata _gasData
    ) public payable returns (uint256) {
        require(callValue <= msg.value, "Invalid call value");
        require(address(inbox) != address(0), "Inbox not set");

        (uint256 maxSubmissionCost, uint256 maxGas, uint256 gasPriceBid) = abi
            .decode(_gasData[0], (uint256, uint256, uint256));

        require(
            maxGas > 0 || gasPriceBid > 0 || maxSubmissionCost > 0,
            SettingZeroGas()
        );

        uint256 ticketID = inbox.createRetryableTicket{value: msg.value}(
            l2Receiver, // Destination address on L2
            callValue, // ETH to send to L2
            maxSubmissionCost, // Cost for submitting the ticket
            msg.sender, // Refund address if the ticket fails
            msg.sender, // Refund any excess ETH
            maxGas, // Max gas for L2 execution
            gasPriceBid, // Bid for L2 gas price
            ""
        );

        emit RetryableTicketCreated(ticketID);
        return ticketID;
    }

    function setInbox(address _inbox) external onlyOwner {
        require(_inbox != address(0), SettingZeroAddress());
        inbox = IInbox(_inbox);
        emit InboxChanged(_inbox);
    }

    function receiveL2Eth() external payable override {
        IBridge bridge = IInbox(inbox).bridge();
        require(msg.sender == address(bridge), NotBridge());
        require(rebalancer != address(0), RebalancerNotSet());
        Address.sendValue(payable(rebalancer), msg.value);
        emit L2EthDeposit(msg.value);
    }

    receive() external payable override {
        require(rebalancer != address(0), RebalancerNotSet());
        Address.sendValue(payable(rebalancer), msg.value);
        emit L2EthDeposit(msg.value);
    }
}

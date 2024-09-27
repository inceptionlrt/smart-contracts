// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@arbitrum/nitro-contracts/src/bridge/IInbox.sol";
import "@arbitrum/nitro-contracts/src/bridge/IOutbox.sol";
import "openzeppelin-4-upgradeable/proxy/utils/Initializable.sol";
import "openzeppelin-4-upgradeable/access/OwnableUpgradeable.sol";
import "./AbstractCrossChainAdapterL1.sol";

contract CrossChainAdapterArbitrumL1 is
    Initializable,
    OwnableUpgradeable,
    AbstractCrossChainAdapterL1
{
    IInbox public inbox;
    uint24 public constant ARBITRUM_CHAIN_ID = 42161;

    event RetryableTicketCreated(uint256 indexed ticketId);

    event InboxChanged(address prevInbox, address newInbox);

    error ArbInboxNotSet();

    function initialize(
        address _transactionStorage,
        address _inbox,
        address _operator
    ) public initializer {
        __Ownable_init();
        __AbstractCrossChainAdapterL1_init(_transactionStorage, _operator);
        setInbox(_inbox);
    }

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

        _handleL2Info(ARBITRUM_CHAIN_ID, _timestamp, _balance, _totalSupply);
    }

    function sendEthToL2(
        uint256 callValue,
        bytes[] calldata _gasData
    ) external payable onlyRebalancer {
        require(callValue <= msg.value, InvalidValue());
        require(address(inbox) != address(0), ArbInboxNotSet());
        require(l2Receiver != address(0), L2ReceiverNotSet());

        (uint256 maxSubmissionCost, uint256 maxGas, uint256 gasPriceBid) = abi
            .decode(_gasData[0], (uint256, uint256, uint256));

        require(
            maxGas > 0 && gasPriceBid > 0 && maxSubmissionCost > 0,
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
    }

    function setInbox(address _inbox) public onlyOwner {
        require(_inbox != address(0), SettingZeroAddress());
        inbox = IInbox(_inbox);
        address prevInbox = address(inbox);
        emit InboxChanged(prevInbox, _inbox);
    }

    function receiveL2Eth() external payable override {
        IBridge bridge = IInbox(inbox).bridge();
        require(msg.sender == address(bridge), NotBridge());
        require(rebalancer != address(0), RebalancerNotSet());
        Address.sendValue(payable(rebalancer), msg.value);
        emit L2EthDeposit(msg.value);
    }
}

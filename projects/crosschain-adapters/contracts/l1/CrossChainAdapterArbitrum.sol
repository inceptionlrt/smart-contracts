// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@arbitrum/nitro-contracts/src/bridge/IInbox.sol";
import "@arbitrum/nitro-contracts/src/bridge/IOutbox.sol";

import "./AbstractCrossChainAdapter.sol";

contract CrossChainAdapterArbitrum is AbstractCrossChainAdapter {
    address public l2Target;
    address public l2Sender;
    IInbox public inbox;
    uint24 public constant ARBITRUM_CHAIN_ID = 42161;
    uint256 maxSubmissionCost = 100000000000;
    uint256 maxGas = 100000000000;
    uint256 gasPriceBid = 1000;

    event GasParametersChanged(
        uint256 maxSubmissionCost,
        uint256 maxGas,
        uint256 gasPriceBid
    );

    event RetryableTicketCreated(uint256 indexed ticketId);

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

    function sendEthToL2(uint256 callValue) public payable returns (uint256) {
        require(address(inbox) != address(0), "Inbox not set");
        require(maxGas > 0, "Invalid gas value");
        uint256 ticketID = inbox.createRetryableTicket{value: msg.value}(
            l2Target,
            callValue,
            maxSubmissionCost,
            msg.sender,
            msg.sender,
            maxGas,
            gasPriceBid,
            ""
        );

        emit RetryableTicketCreated(ticketID);
        return ticketID;
    }

    function setGasParameters(
        uint256 _maxSubmissionCost,
        uint256 _maxGas,
        uint256 _gasPriceBid
    ) external onlyOwner {
        require(
            _maxSubmissionCost > 0 && _maxGas > 0 && _gasPriceBid > 0,
            SettingZeroAddress()
        );
        maxSubmissionCost = _maxSubmissionCost;
        maxGas = _maxGas;
        gasPriceBid = _gasPriceBid;
        emit GasParametersChanged(_maxSubmissionCost, _maxGas, _gasPriceBid);
    }

    function setL2Target(address _l2Target) external onlyOwner {
        require(_l2Target != address(0), SettingZeroAddress());
        l2Target = _l2Target;
    }

    function setL2Sender(address _l2Sender) external onlyOwner {
        require(_l2Sender != address(0), SettingZeroAddress());
        l2Sender = _l2Sender;
    }

    function setInbox(address _inbox) external onlyOwner {
        require(_inbox != address(0), SettingZeroAddress());
        inbox = IInbox(_inbox);
    }
}

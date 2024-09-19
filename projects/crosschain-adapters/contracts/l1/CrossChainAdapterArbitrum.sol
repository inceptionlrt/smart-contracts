// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@arbitrum/nitro-contracts/src/bridge/Inbox.sol";
import "@arbitrum/nitro-contracts/src/bridge/Outbox.sol";
import "./AbstractCrossChainAdapter.sol";

contract CrossChainBridgeArbitrum is AbstractCrossChainAdapter {
    address public inboxArbitrum;

    uint24 public constant ARBITRUM_CHAIN_ID = 42161;

    constructor(
        address _transactionStorage
    ) AbstractCrossChainAdapter(_transactionStorage) {}

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external override {
        IBridge bridge = IInbox(inboxArbitrum).bridge();
        require(msg.sender == address(bridge), NotBridge());
        IOutbox outbox = IOutbox(bridge.activeOutbox());
        address l2Sender = outbox.l2ToL1Sender();
        require(l2Sender == l2Target, NotAuthorizedByL2());

        handleL2Info(ARBITRUM_CHAIN_ID, _timestamp, _balance, _totalSupply);
    }

    function setInboxArbitrum(address _inbox) external onlyOwner {
        require(_inbox != address(0), SettingZeroAddress());
        inboxArbitrum = _inbox;
    }
}

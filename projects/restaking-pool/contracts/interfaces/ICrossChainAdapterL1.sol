// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICrossChainAdapter} from "./ICrossChainAdapter.sol";

interface ICrossChainAdapterL1 is ICrossChainAdapter {
    error NotBridge(address caller);
    error NotRebalancer(address caller);
    error FutureTimestamp();
    error UnauthorizedOriginalSender();
    error TransferToRebalancerFailed();
    error SettingZeroAddress();
    error SettingZeroGas();
    error RebalancerNotSet();
    error TxStorageNotSet();
    error InvalidValue();
    error L2ReceiverNotSet();
    error GasDataNotProvided();
    error OnlyRebalancerCanCall(address caller);
    error OnlyOperatorCanCall(address caller);

    event L2EthDeposit(uint256 chainId, uint256 amount);
    event L2InfoReceived(
        uint24 indexed chainId,
        uint256 timestamp,
        uint256 balance,
        uint256 totalSupply
    );
    event ReceiveTriggered(address caller, uint256 amount);

    event CrossChainBridgeChanged(
        address prevCrossChainBridge,
        address newCrossChainBridge
    );
    event RebalancerChanged(address prevRebalancer, address newRebalancer);
    event L2ReceiverChanged(address prevL2Receiver, address newL2Receiver);
    event L2SenderChanged(address prevL2Sender, address newL2Sender);
    event TxStorageChanged(address prevTxStorage, address newTxStorage);
    event RecoverFundsInitiated(uint256 amount);

    function sendEthToL2(uint256 _chainId) external payable;

    function quoteSendEth(uint256 _chainId, bytes memory _options) external view returns (uint256);

    function handleCrossChainData(
        uint256 _chainId,
        bytes calldata _payload
    ) external;

    function recoverFunds() external;

    function receiveCrosschainEth(uint256 _chainId) external payable;

    function setCrossChainBridge(address _newCrossChainBridge) external;

    function setRebalancer(address _newRebalancer) external;

    function setTransactionStorage(address _newTxStorage) external;

    function crosschainBridge() external view returns (address);

    function rebalancer() external view returns (address);

    function transactionStorage() external view returns (address);

    receive() external payable;
}

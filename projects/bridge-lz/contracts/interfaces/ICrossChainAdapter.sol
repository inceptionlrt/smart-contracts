// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICrossChainAdapter {
    error NotBridge(address caller);
    error NotVault(address caller);
    error FutureTimestamp();
    error UnauthorizedOriginalSender();
    error TransferToVaultFailed();
    error VaultNotSet();
    error TxStorageNotSet();
    error InvalidValue();
    error L2ReceiverNotSet();
    error GasDataNotProvided();
    error OnlyVaultCanCall(address caller);
    error OnlyOperatorCanCall(address caller);

    event L2EthDeposit(uint256 chainId, uint256 amount);
    event L2InfoReceived(uint24 indexed chainId, uint256 timestamp, uint256 balance, uint256 totalSupply);
    event ReceiveTriggered(address caller, uint256 amount);

    event VaultChanged(address prevVault, address newVault);
    event L2ReceiverChanged(address prevL2Receiver, address newL2Receiver);
    event L2SenderChanged(address prevL2Sender, address newL2Sender);
    event TxStorageChanged(address prevTxStorage, address newTxStorage);
    event RecoverFundsInitiated(uint256 amount);

    function sendEthCrossChain(uint256 _chainId) external payable;

    function handleCrossChainData(uint256 _chainId, bytes calldata _payload) external;

    function recoverFunds() external;

    function receiveCrossChainEth(uint256 _chainId) external payable;

    receive() external payable;
}

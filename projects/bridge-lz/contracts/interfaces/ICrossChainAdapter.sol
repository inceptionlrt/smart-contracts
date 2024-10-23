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

    event CrossChainEthDeposit(uint256 chainId, uint256 amount);
    event CrossChainInfoReceived(uint256 indexed chainId, uint256 timestamp, uint256 balance, uint256 totalSupply);
    event ReceiveTriggered(address caller, uint256 amount);

    event VaultChanged(address prevVault, address newVault);
    event TxStorageChanged(address prevTxStorage, address newTxStorage);
    event RecoverFundsInitiated(uint256 amount);

    function sendEthCrossChain(uint256 _chainId) external payable;

    function recoverFunds() external;

    receive() external payable;
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface ICrossChainBridge {
    // ======================= Events =======================
    event VaultChanged(address prevVault, address newVault);
    event RecoverFundsInitiated(uint256 amount);
    event ReceiveTriggered(address caller, uint256 amount);
    event CrossChainEthDeposit(uint256 chainId, uint256 amount);
    event ChainIdAdded(uint256 _chainId);

    // ======================= Errors =======================
    error VaultNotSet();
    error TransferToVaultFailed();
    error SettingZeroAddress();
    error NotVault(address caller);
    error ChainIdNotFound(uint256 chainId);

    // ======================= Functions =======================
    function setVault(address _newVault) external;

    function recoverFunds() external;

    function quoteSendEth(uint256 _chainId) external view returns (uint256);

    function sendEthCrossChain(uint256 _chainId) external payable;

    receive() external payable;
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface ICrossChainBridgeAdapter {
    // ======================= Events =======================

    event CrossChainMessageReceived(uint256 indexed chainId, uint256 value, bytes data);
    event CrossChainMessageSent(uint256 indexed chainId, uint256 value, bytes data, uint256 fee);
    event ChainIdAdded(uint32 indexed _eid, uint256 indexed _chainId);
    event CrossChainDataSuccessfullyRelayed(uint256 indexed chainId);
    event CrossChainDataProcessingFailed(uint256 indexed chainId, string reason);
    
    event CrossChainEthDeposit(uint256 chainId, uint256 amount);
    event CrossChainInfoReceived(uint256 indexed chainId, uint256 timestamp, uint256 balance, uint256 totalSupply);
    event ReceiveTriggered(address caller, uint256 amount);
    
    event VaultChanged(address prevVault, address newVault);
    event TxStorageChanged(address prevTxStorage, address newTxStorage);
    event RecoverFundsInitiated(uint256 amount);

    // ======================= Errors =======================

    error SettingZeroAddress();
    error NoAdapterSet();
    error Unauthorized(address caller);
    error NoDestEidFoundForChainId(uint256 chainId);
    error ArraysLengthsMismatch();
    
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

    // ======================= Functions =======================
    
    // CrossChainBridge-related functions
    function eidToChainId(uint32 _eid) external view returns (uint256);

    function chainIdToEid(uint256 _chainId) external view returns (uint32);

    function sendCrosschain(uint256 _chainId, bytes calldata _payload, bytes calldata _options) external payable;

    function quote(
        uint256 _chainId,
        bytes calldata _payload,
        bytes memory _options,
        bool _payInLzToken
    ) external view returns (uint256);

    function quoteSendEth(uint256 _chainId) external view returns (uint256);

    function setChainIdFromEid(uint32 _eid, uint256 _chainId) external;

    function getChainIdFromEid(uint32 _eid) external view returns (uint256);

    function getEidFromChainId(uint256 _chainId) external view returns (uint32);

    // CrossChainAdapter-related functions
    function sendEthCrossChain(uint256 _chainId) external payable;

    function recoverFunds() external;

    receive() external payable;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface ILZCrossChainAdapterL1 {
    event TargetReceiverChanged(
        address prevTargetReceiver,
        address newTargetReceiver
    );
    event RecoverFundsInitiated(uint256 amount);
    event ReceiveTriggered(address caller, uint256 amount);
    event CrossChainEthDeposit(uint256 chainId, uint256 amount);
    event ChainIdAdded(uint256 _chainId);
    event CrossChainMessageSent(
        uint256 indexed chainId,
        uint256 value,
        bytes data,
        uint256 fee
    );

    // Custom Errors
    error TargetReceiverNotSet();
    error TransferToTargetReceiverFailed();
    error SettingZeroAddress();
    error NotTargetReceiver(address caller);
    error ChainIdNotFound(uint256 chainId);
    error NoDestEidFoundForChainId(uint256 chainId);
    error ArraysLengthsMismatch();

    // State Variables
    function targetReceiver() external view returns (address);

    function eidToChainId(uint32 eid) external view returns (uint256);

    function chainIdToEid(uint256 chainId) external view returns (uint32);

    // Public Functions
    function setTargetReceiver(address _newTargetReceiver) external;

    function recoverFunds() external;

    function sendEthCrossChain(
        uint256 _chainId,
        bytes memory _options
    ) external payable;

    function quoteSendEth(
        uint256 _chainId,
        bytes memory _options
    ) external view returns (uint256);

    function setChainIdFromEid(uint32 _eid, uint256 _chainId) external;

    function getChainIdFromEid(uint32 _eid) external view returns (uint256);

    function getEidFromChainId(uint256 _chainId) external view returns (uint32);
}

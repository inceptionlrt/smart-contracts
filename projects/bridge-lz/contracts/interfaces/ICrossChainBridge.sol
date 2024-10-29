// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface ICrossChainBridge {
    event TargetReceiverChanged(
        address indexed prevTargetReceiver,
        address indexed newTargetReceiver
    );
    event RecoverFundsInitiated(uint256 amount);
    event ReceiveTriggered(address indexed caller, uint256 amount);
    event CrossChainEthDeposit(uint32 indexed chainId, uint256 amount);
    event ChainIdAdded(uint32 indexed _chainId, uint32 indexed _eid);
    event ChainIdAndEidDeleted(uint32 indexed _chainId, uint32 indexed _eid);
    event CrossChainMessageReceived(uint32 indexed chainId);
    event CrossChainEthReceived(uint32 indexed chainId, uint256 ethAmount);
    event CrossChainMessageSent(
        uint32 indexed chainId,
        uint256 value,
        bytes data,
        uint256 fee
    );

    error TargetReceiverNotSet();
    error TransferToTargetReceiverFailed();
    error SettingZeroAddress();
    error NotTargetReceiver(address caller);

    function setTargetReceiver(address _newTargetReceiver) external;

    function recoverFunds() external;

    function quoteSendEth(
        uint32 _chainId,
        bytes memory _options
    ) external view returns (uint256);

    function sendEthCrossChain(
        uint32 _chainId,
        bytes memory _options
    ) external payable;

    receive() external payable;
}

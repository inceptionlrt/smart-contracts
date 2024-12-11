// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface ICrossChainBridgeERC20 {
    event TargetReceiverChanged(
        address prevTargetReceiver,
        address newTargetReceiver
    );
    event RecoverFundsInitiated(uint256 amount);
    event ReceiveTriggered(address caller, uint256 amount);
    event CrossChainERC20Deposit(uint256 chainId, uint256 amount);
    event ChainIdAdded(uint256 _chainId);
    event CrossChainMessageReceived(
        uint256 indexed chainId,
        uint256 value,
        bytes data
    );
    event CrossChainMessageSent(
        uint256 indexed chainId,
        uint256 value,
        bytes data,
        uint256 fee
    );

    error TargetReceiverNotSet();
    error TransferToTargetReceiverFailed();
    error SettingZeroAddress();
    error NotTargetReceiver(address caller);
    error ChainIdNotFound(uint256 chainId);

    function setTargetReceiver(address _newTargetReceiver) external;

    function recoverFunds() external;

    function quoteSendERC20(
        uint256 _chainId,
        bytes memory _options
    ) external view returns (uint256);

    function sendERC20CrossChain(
        uint256 _chainId,
        bytes memory _options
    ) external payable returns (uint256);

    function getValueFromOpts(
        bytes calldata _options
    ) external view returns (uint256);

    receive() external payable;
}

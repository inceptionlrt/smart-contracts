// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title ICrossChainAdapterL2
 * @dev Paul Fomichov
 */
interface ICrossChainAdapterL2 {
    error VaultNotSet();
    error L1TargetNotSet();
    error SettingZeroGas();
    error GasDataTooShort();
    error SettingZeroAddress();
    error SendingZeroValue();
    error OnlyVault();
    error InsufficientValueSent();
    error TransferToVaultFailed(uint256 amount);
    error OnlyOperatorCanCall(address caller);
    event RecoverFundsInitiated(uint256 amount);

    event ReceiveTriggered(address indexed caller, uint256 amount);
    event AssetsInfoSentToL1(
        uint256 indexed tokensAmount,
        uint256 indexed ethAmount,
        uint256 indexed withrawalId //revelant for Arbitrum, always 0 for Optimism
    );
    event L1TargetChanged(
        address indexed prevL1Target,
        address indexed newL1Target
    );
    event VaultChanged(address indexed preVault, address indexed newVault);
    event EthSentToL1(uint256 indexed amount, uint256 indexed withrawalId); //revelant for Arbitrum, always 0 for Optimism
    event OperatorChanged(
        address indexed prevOperator,
        address indexed newOperator
    );

    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount,
        bytes[] calldata _gasData
    ) external payable returns (bool success);

    function sendEthToL1(
        uint256 _callValue,
        bytes[] calldata _gasData
    ) external payable returns (bool success);

    function recoverFunds() external;

    receive() external payable;
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title ICrossChainAdapterL2
 * @dev Paul Fomichov
 */
interface ICrossChainAdapterL2 {
    error VaultNotSet();
    error L1TargetNotSet();
    error SettingZeroGas();
    error SettingZeroAddress();
    error OnlyVault();
    error InsufficientValueSent();
    error TransferToVaultFailed(uint256 amount);
    error OnlyOperatorCanCall(address caller);

    event MaxGasChanged(uint256 newMaxGas);
    event ReceiveTriggered(uint256 amount);
    event AssetsInfoSentToL1(
        uint256 indexed tokensAmount,
        uint256 indexed ethAmount,
        uint256 indexed withrawalId //revelant for Arbitrum, always 0 for Optimism
    );

    event EthSentToL1(uint256 indexed amount, uint256 indexed withrawalId); //revelant for Arbitrum, always 0 for Optimism

    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount,
        bytes[] calldata _gasData
    ) external returns (bool success);

    function sendEthToL1(
        uint256 _callValue,
        bytes[] calldata _gasData
    ) external payable returns (bool success);

    function recoverFunds() external;

    receive() external payable;
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title ICrossChainAdapterL2
 * @dev Paul Fomichov
 */
interface ICrossChainAdapterL2 {
    error VaultNotSet();
    error SettingZeroGas();
    error OnlyVault();
    error InsufficientValueSent();
    error TransferToVaultFailed(uint256 amount);

    event MaxGasChanged(uint256 newMaxGas);
    event ReceiveTriggered(uint256 amount);

    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount
    ) external returns (bool success);

    function sendEthToL1(
        uint256 _callValue
    ) external payable returns (bool success);

    function recoverFunds() external;

    receive() external payable;
}

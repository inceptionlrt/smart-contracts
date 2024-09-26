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

    event MaxGasChanged(uint256 newMaxGas);

    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount
    ) external returns (bool success);

    function sendEthToL1(
        uint256 _callValue,
        uint256 _fees
    ) external payable returns (bool success);
}

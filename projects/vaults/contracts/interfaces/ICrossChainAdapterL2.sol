// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICrossChainAdapter} from "./ICrossChainAdapter.sol";

interface ICrossChainAdapterL2 is ICrossChainAdapter {
    error SettingZeroAddress();
    error InvalidValue();
    error OnlyOmniVaultCanCall(address caller);
    error OnlyOperatorCanCall(address caller);
    error OmniVaultNotSet();
    error BridgeNotSet();
    error TransferToOmniVaultFailed();
    error Unimplemented();

    event L1EthDeposit(uint256 amount);
    event RecoverFundsInitiated(uint256 amount);
    event ReceiveTriggered(address sender, uint256 value);

    event CrossChainBridgeChanged(
        address prevCrossChainBridge,
        address newCrossChainBridge
    );

    event OmniVaultChanged(address prevOmniVault, address newOmniVault);

    function sendEthToL1() external payable;

    function sendDataToL1(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external payable;

    function quote(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external view returns (uint256);

    function quoteSendEth() external view returns (uint256);

    function recoverFunds() external;

    function receiveCrosschainEth(uint256 _chainId) external payable;

    function setCrossChainBridge(address _newCrossChainBridge) external;

    function setOmniVault(address _newOmniVault) external;

    function omniVault() external view returns (address);

    receive() external payable;
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "../interfaces/ICrossChainBridge.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

abstract contract AbstractCrossChainAdapter is ICrossChainBridge {
    //NOTE: vault is a terming meaning InceptionOmniVault on L2 or Rebalancer on L1
    address public vault;

    modifier onlyVault() {
        if (msg.sender != vault) {
            revert NotVault(msg.sender);
        }
        _;
    }

    function setVault(address _newVault) external override {
        require(_newVault != address(0), SettingZeroAddress());
        emit VaultChanged(vault, _newVault);
        vault = _newVault;
    }

    function recoverFunds() external override {
        require(vault != address(0), VaultNotSet());
        uint256 amount = address(this).balance;
        (bool success, ) = vault.call{ value: amount }("");
        require(success, TransferToVaultFailed());
        emit RecoverFundsInitiated(amount);
    }

    //primary function for receiving ETH from other chain
    function _handleCrossChainEth(uint256 _chainId) internal {
        emit CrossChainEthDeposit(_chainId, msg.value);
        Address.sendValue(payable(vault), msg.value);
    }

    //fallback function just in case a cross-chain adapter messes up sending ETH to the right function
    receive() external payable override {
        emit ReceiveTriggered(msg.sender, msg.value);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { OAppUpgradeable } from "../OAppUpgradeable.sol";

import { ICrossChainBridge } from "../interfaces/ICrossChainBridge.sol";

abstract contract AbstractCrossChainAdapter is ICrossChainBridge, OAppUpgradeable {
    //NOTE: vault is a term encompassing both Rebalancer on L1 or InceptionOmniVault on L2
    address public vault;

    modifier onlyOwnerRestricted() virtual;

    modifier onlyVault() {
        if (msg.sender != vault) {
            revert NotVault(msg.sender);
        }
        _;
    }

    function setVault(address _newVault) external override onlyOwnerRestricted {
        require(_newVault != address(0), SettingZeroAddress());
        emit VaultChanged(vault, _newVault);
        vault = _newVault;
    }

    function recoverFunds() external override onlyOwnerRestricted {
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

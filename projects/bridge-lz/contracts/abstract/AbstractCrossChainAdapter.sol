// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { OAppUpgradeable } from "../OAppUpgradeable.sol";

import { ICrossChainBridge } from "../interfaces/ICrossChainBridge.sol";

abstract contract AbstractCrossChainAdapter is ICrossChainBridge {
    //NOTE: targetReceiver is a term encompassing both Rebalancer on L1 or InceptionOmniTargetReceiver on L2
    address public targetReceiver;

    modifier onlyOwnerRestricted() virtual;

    modifier onlyTargetReceiver() {
        if (msg.sender != targetReceiver) {
            revert NotTargetReceiver(msg.sender);
        }
        _;
    }

    function setTargetReceiver(address _newTargetReceiver) external override onlyOwnerRestricted {
        require(_newTargetReceiver != address(0), SettingZeroAddress());
        emit TargetReceiverChanged(targetReceiver, _newTargetReceiver);
        targetReceiver = _newTargetReceiver;
    }

    function recoverFunds() external override onlyOwnerRestricted {
        require(targetReceiver != address(0), TargetReceiverNotSet());
        uint256 amount = address(this).balance;
        (bool success, ) = targetReceiver.call{ value: amount }("");
        require(success, TransferToTargetReceiverFailed());
        emit RecoverFundsInitiated(amount);
    }

    //primary function for receiving ETH from other chain
    function _handleCrossChainEth(uint256 _chainId) internal {
        emit CrossChainEthDeposit(_chainId, msg.value);
        Address.sendValue(payable(targetReceiver), msg.value);
    }

    //fallback function just in case a cross-chain adapter messes up sending ETH to the right function
    receive() external payable override {
        emit ReceiveTriggered(msg.sender, msg.value);
    }
}
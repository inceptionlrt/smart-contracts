// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@eth-optimism/contracts/L2/messaging/IL2CrossDomainMessenger.sol";
import "@eth-optimism/contracts/L2/messaging/L2StandardBridge.sol";
import "./AbstractCrossChainAdapterL2.sol";

contract CrossChainAdapterOptimismL2 is AbstractCrossChainAdapterL2 {
    IL2CrossDomainMessenger public l2Messenger;
    L2StandardBridge public l2StandardBridge;
    uint256 public maxGas;

    function initialize(
        IL2CrossDomainMessenger _l2Messenger,
        L2StandardBridge _l2StandardBridge,
        address _l1Target,
        address _operator
    ) public initializer {
        AbstractCrossChainAdapterL2.initialize(
            _l1Target,
            _msgSender(),
            _operator
        );
        l2Messenger = _l2Messenger;
        l2StandardBridge = _l2StandardBridge;
        maxGas = 20_000_000;
    }

    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount
    ) external override returns (bool success) {
        require(l1Target != address(0), L1TargetNotSet());
        bytes memory data = abi.encodeWithSignature(
            "receiveAssetsInfo(uint256,uint256)",
            tokensAmount,
            ethAmount
        );

        l2Messenger.sendMessage(
            l1Target,
            data,
            200_000 // Gas limit for L1 execution
        );

        emit AssetsInfoSentToL1(tokensAmount, ethAmount, 0);
        return true;
    }

    function sendEthToL1(
        uint256 _callValue
    ) external payable override onlyVault returns (bool success) {
        require(_callValue <= msg.value, InsufficientValueSent());
        require(l1Target != address(0), L1TargetNotSet());

        l2StandardBridge.withdrawTo(
            address(0),
            l1Target,
            _callValue,
            uint32(maxGas),
            ""
        );

        emit EthSentToL1(msg.value, 0);
        return true;
    }
}

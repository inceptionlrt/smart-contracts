// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@eth-optimism/contracts/L2/messaging/IL2CrossDomainMessenger.sol";
import "@eth-optimism/contracts/L2/messaging/L2StandardBridge.sol";
import "./AbstractCrossChainAdapterL2.sol";

contract CrossChainAdapterOptimismL2 is AbstractCrossChainAdapterL2 {
    IL2CrossDomainMessenger public l2Messenger;
    L2StandardBridge public l2StandardBridge;

    function initialize(
        IL2CrossDomainMessenger _l2Messenger,
        L2StandardBridge _l2StandardBridge,
        address _l1Target,
        address _operator
    ) public initializer {
        __AbstractCrossChainAdapterL1_init(_l1Target, _msgSender(), _operator);
        l2Messenger = _l2Messenger;
        l2StandardBridge = _l2StandardBridge;
    }

    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount,
        bytes[] calldata _gasData
    ) external override returns (bool success) {
        require(l1Target != address(0), L1TargetNotSet());
        uint32 maxGas = _decodeGas(_gasData);
        bytes memory data = abi.encodeWithSignature(
            "receiveAssetsInfo(uint256,uint256)",
            tokensAmount,
            ethAmount
        );

        l2Messenger.sendMessage(l1Target, data, maxGas);

        emit AssetsInfoSentToL1(tokensAmount, ethAmount, 0);
        return true;
    }

    function sendEthToL1(
        uint256 _callValue,
        bytes[] calldata _gasData
    ) external payable override onlyVault returns (bool success) {
        require(_callValue <= msg.value, InsufficientValueSent());
        require(l1Target != address(0), L1TargetNotSet());

        uint32 maxGas = _decodeGas(_gasData);

        l2StandardBridge.withdrawTo(
            address(0), // Address(0) represents ETH in L2 StandardBridge
            l1Target,
            _callValue,
            uint32(maxGas),
            ""
        );

        emit EthSentToL1(msg.value, 0);
        return true;
    }

    function _decodeGas(
        bytes[] calldata _gasData
    ) internal pure returns (uint32 maxGas) {
        maxGas = abi.decode(_gasData[0], (uint32));
        require(maxGas > 0, SettingZeroGas());
        return maxGas;
    }
}

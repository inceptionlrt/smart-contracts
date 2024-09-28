// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@eth-optimism/contracts/L2/messaging/IL2CrossDomainMessenger.sol";
import "./AbstractCrossChainAdapterL2.sol";
import "@eth-optimism/contracts/L2/messaging/L2StandardBridge.sol";

interface OptimismBridge {
    function sendMessage(
        address target,
        bytes calldata data,
        uint32 gasLimit
    ) external payable;

    function bridgeETHTo(
        address _to,
        uint32 _minGasLimit,
        bytes calldata _extraData
    ) external payable;
}

contract CrossChainAdapterOptimismL2 is AbstractCrossChainAdapterL2 {
    OptimismBridge public l2StandardBridge;

    event BridgeChanged(address indexed oldBridge, address indexed newBridge);

    function initialize(
        address _l1Target,
        address _operator
    ) public initializer {
        __AbstractCrossChainAdapterL1_init(_l1Target, _msgSender(), _operator);
        l2StandardBridge = OptimismBridge(
            0x4200000000000000000000000000000000000010
        );
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

        l2StandardBridge.sendMessage(l1Target, data, maxGas);

        emit AssetsInfoSentToL1(tokensAmount, ethAmount, 0);
        return true;
    }

    function sendEthToL1(
        uint256,
        bytes[] calldata _gasData
    ) external payable override onlyVault returns (bool success) {
        require(msg.value > 0, SendingZeroValue());
        require(l1Target != address(0), L1TargetNotSet());
        require(_gasData[0].length >= 4, GasDataTooShort());
        uint32 maxGas = _decodeGas(_gasData);

        l2StandardBridge.bridgeETHTo{value: msg.value}(l1Target, maxGas, "");

        emit EthSentToL1(msg.value, 0);
        return true;
    }

    function setBridge(address _newBridgeAddress) external onlyOwner {
        require(_newBridgeAddress != address(0), SettingZeroAddress());
        emit BridgeChanged(address(l2StandardBridge), _newBridgeAddress);
        l2StandardBridge = OptimismBridge(_newBridgeAddress);
    }

    function _decodeGas(
        bytes[] calldata _gasData
    ) internal pure returns (uint32 maxGas) {
        maxGas = abi.decode(_gasData[0], (uint32));
        require(maxGas > 0, SettingZeroGas());
        return maxGas;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./AbstractCrossChainAdapterL2.sol";

interface L2StandardBridge {
    function bridgeETHTo(
        address _to,
        uint32 _minGasLimit,
        bytes calldata _extraData
    ) external payable;
}

interface CrossDomainMessenger {
    function sendMessage(
        address _target,
        bytes calldata _message,
        uint32 _minGasLimit
    ) external payable;
}

contract CrossChainAdapterOptimismL2 is AbstractCrossChainAdapterL2 {
    L2StandardBridge public l2StandardBridge;
    CrossDomainMessenger public crossDomainMessenger;

    event BridgeChanged(address indexed oldBridge, address indexed newBridge);
    event CrossDomainMessengerChanged(
        address indexed oldMessenger,
        address indexed newMessenger
    );

    function initialize(
        address _l1Target,
        address _operator
    ) public initializer {
        __AbstractCrossChainAdapterL1_init(_l1Target, _msgSender(), _operator);
        l2StandardBridge = L2StandardBridge(
            0x4200000000000000000000000000000000000010
        );
        crossDomainMessenger = CrossDomainMessenger(
            0x4200000000000000000000000000000000000007
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
            "receiveL2Info(uint256,uint256,uint256)",
            block.timestamp,
            tokensAmount,
            ethAmount
        );

        crossDomainMessenger.sendMessage(l1Target, data, maxGas);

        emit AssetsInfoSentToL1(tokensAmount, ethAmount, 0);
        return true;
    }

    function sendEthToL1(
        uint256,
        bytes[] calldata _gasData
    ) external payable override onlyVault returns (bool success) {
        require(msg.value > 0, SendingZeroValue());
        require(l1Target != address(0), L1TargetNotSet());
        uint32 maxGas = _decodeGas(_gasData);

        l2StandardBridge.bridgeETHTo{value: msg.value}(l1Target, maxGas, "");

        emit EthSentToL1(msg.value, 0);
        return true;
    }

    function setBridge(address _newBridgeAddress) external onlyOwner {
        require(_newBridgeAddress != address(0), SettingZeroAddress());
        emit BridgeChanged(address(l2StandardBridge), _newBridgeAddress);
        l2StandardBridge = L2StandardBridge(_newBridgeAddress);
    }

    function setCrossDomainMessenger(address _newMessenger) external onlyOwner {
        require(_newMessenger != address(0), SettingZeroAddress());
        emit CrossDomainMessengerChanged(
            address(crossDomainMessenger),
            _newMessenger
        );
        crossDomainMessenger = CrossDomainMessenger(_newMessenger);
    }

    function _decodeGas(
        bytes[] calldata _gasData
    ) internal pure returns (uint32 maxGas) {
        require(_gasData[0].length >= 4, GasDataTooShort());
        maxGas = abi.decode(_gasData[0], (uint32));
        require(maxGas > 0, SettingZeroGas());
        return maxGas;
    }
}

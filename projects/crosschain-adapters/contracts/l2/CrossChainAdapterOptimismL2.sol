// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./AbstractCrossChainAdapterL2.sol";

/**
 * @title CrossChainAdapterOptimismL2
 * @dev Interface for calling Optimism L2StandardBridge.
 */
interface L2StandardBridge {
    /**
     * @notice Bridges ETH from L2 to L1.
     * @param _to Address on L1 receiving the ETH.
     * @param _minGasLimit Minimum gas limit required for the cross-chain tx.
     * @param _extraData Calldata, almost universally left as blank.
     */
    function bridgeETHTo(
        address _to,
        uint32 _minGasLimit,
        bytes calldata _extraData
    ) external payable;
}

/**
 * @title CrossChainAdapterOptimismL2
 * @dev Interface for calling Optimism CrossDomainMessenger.
 */
interface CrossDomainMessenger {
    /**
     * @notice Sends assets info from L2 to L1.
     * @param _target Target address (Rebalancer) on L1 to receive the message.
     * @param _message Encoded call to .
     * @param _minGasLimit Minimum gas limit for message processing.
     */
    function sendMessage(
        address _target,
        bytes calldata _message,
        uint32 _minGasLimit
    ) external payable;
}

/**
 * @title CrossChainAdapterOptimismL2
 * @dev Cross-chain adapter for Optimism Layer 2. Manages communication with L1 and handles asset transfers.
 */
contract CrossChainAdapterOptimismL2 is AbstractCrossChainAdapterL2 {
    /// @notice Optimism standard bridge for ETH transfers from L2 to L1.
    L2StandardBridge public l2StandardBridge;

    /// @notice Optimism contract for relaying messages from L2 to L1.
    CrossDomainMessenger public crossDomainMessenger;

    event BridgeChanged(address indexed oldBridge, address indexed newBridge);

    event CrossDomainMessengerChanged(
        address indexed oldMessenger,
        address indexed newMessenger
    );

    /**
     * @notice Initializes the contract with the L1 target, operator, and sets default bridge and messenger addresses.
     * @param _l1Target L1 target address.
     * @param _operator Operator address.
     */
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

    /**
     * @notice Sends token and ETH balance information from L2 to L1.
     * @param tokensAmount The amount of tokens to send to L1.
     * @param ethAmount The amount of ETH to send to L1.
     * @param _gasData Encoded gas parameters, including the max gas value.
     * @return success True if the message was successfully sent.
     *
     * Emits an {AssetsInfoSentToL1} event.
     */
    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount,
        bytes[] calldata _gasData
    ) external payable override returns (bool success) {
        require(l1Target != address(0), L1TargetNotSet());
        uint32 maxGas = _decodeGas(_gasData);

        // Encode the data to send the assets info to L1
        bytes memory data = abi.encodeWithSignature(
            "receiveL2Info(uint256,uint256,uint256)",
            block.timestamp,
            tokensAmount,
            ethAmount
        );

        // Send message to L1 via cross-domain messenger
        crossDomainMessenger.sendMessage{value: msg.value}(
            l1Target,
            data,
            maxGas
        );

        emit AssetsInfoSentToL1(tokensAmount, ethAmount, 0);
        return true;
    }

    /**
     * @notice Sends ETH from L2 to L1 using the L2 standard bridge.
     * @param _gasData Encoded gas parameter - max gas value.
     * @return success True if the ETH was successfully sent.
     *
     * Emits an {EthSentToL1} event.
     *
     * Reverts if no ETH is sent or if the L1 target is not set.
     */
    function sendEthToL1(
        uint256,
        bytes[] calldata _gasData
    ) external payable override onlyVault returns (bool success) {
        require(msg.value > 0, SendingZeroValue());
        require(l1Target != address(0), L1TargetNotSet());
        uint32 maxGas = _decodeGas(_gasData);

        // Bridge ETH to L1 via the L2 standard bridge
        l2StandardBridge.bridgeETHTo{value: msg.value}(l1Target, maxGas, "");

        emit EthSentToL1(msg.value, 0);
        return true;
    }

    /**
     * @notice Sets a new L2 standard bridge address.
     * @dev Should almost never be called on mainnet, only for testing.
     * @param _newBridgeAddress New L2 standard bridge address.
     *
     * Emits a {BridgeChanged} event.
     */
    function setBridge(address _newBridgeAddress) external onlyOwner {
        require(_newBridgeAddress != address(0), SettingZeroAddress());
        emit BridgeChanged(address(l2StandardBridge), _newBridgeAddress);
        l2StandardBridge = L2StandardBridge(_newBridgeAddress);
    }

    /**
     * @notice Sets a new cross-domain messenger address.
     * @param _newMessenger New cross-domain messenger address.
     *
     * Emits a {CrossDomainMessengerChanged} event.
     */
    function setCrossDomainMessenger(address _newMessenger) external onlyOwner {
        require(_newMessenger != address(0), SettingZeroAddress());
        emit CrossDomainMessengerChanged(
            address(crossDomainMessenger),
            _newMessenger
        );
        crossDomainMessenger = CrossDomainMessenger(_newMessenger);
    }

    /**
     * @notice Decodes the gas data to extract the max gas value.
     * @param _gasData Encoded gas data.
     * @return maxGas The decoded max gas value.
     *
     * Reverts if the gas data is too short or the max gas is zero.
     */
    function _decodeGas(
        bytes[] calldata _gasData
    ) internal pure returns (uint32 maxGas) {
        require(_gasData[0].length >= 4, GasDataTooShort());
        maxGas = abi.decode(_gasData[0], (uint32));
        require(maxGas > 0, SettingZeroGas());
        return maxGas;
    }
}

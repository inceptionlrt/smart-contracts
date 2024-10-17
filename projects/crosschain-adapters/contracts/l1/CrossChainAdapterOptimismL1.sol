// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@eth-optimism/contracts/L1/messaging/IL1CrossDomainMessenger.sol";
import "@eth-optimism/contracts/L1/messaging/IL1StandardBridge.sol";
import "openzeppelin-4-upgradeable/access/OwnableUpgradeable.sol";
import "openzeppelin-4-upgradeable/proxy/utils/Initializable.sol";
import "./AbstractCrossChainAdapterL1.sol";

interface PayableCrossDomainMessenger {
    function sendMessage(
        address _target,
        bytes calldata _message,
        uint32 _gasLimit
    ) external payable;
}

/**
 * @author The InceptionLRT team
 * @title CrossChainAdapterOptimismL1
 * @dev Cross-chain adapter implementation for Optimism Layer 1.
 */
contract CrossChainAdapterOptimismL1 is
    Initializable,
    OwnableUpgradeable,
    AbstractCrossChainAdapterL1
{
    /// @notice Emitted when a cross-chain transaction to L2 Optimism is sent.
    /// @param amountSent The amount of ETH sent.
    event CrossChainTxOptimismSent(uint256 indexed amountSent);

    /// @notice Optimism chain ID constant.
    uint24 public constant OPTIMISM_CHAIN_ID = 10;

    /// @notice Address of the L1 cross-domain messenger.
    IL1CrossDomainMessenger public l1CrossDomainMessenger;

    /// @notice Address of the L1 standard bridge.
    IL1StandardBridge public l1StandardBridge;

    /**
     * @notice Initializes the contract with the cross-domain messenger, standard bridge, transaction storage, and operator.
     * @param _l1CrossDomainMessenger Address of the Optimism cross-domain messenger.
     * @param _l1StandardBridge Address of the Optimism standard bridge.
     * @param _transactionStorage Transaction storage contract address.
     * @param _operator Operator address.
     */
    function initialize(
        IL1CrossDomainMessenger _l1CrossDomainMessenger,
        IL1StandardBridge _l1StandardBridge,
        address _transactionStorage,
        address _operator
    ) public initializer {
        __Ownable_init();
        __AbstractCrossChainAdapterL1_init(_transactionStorage, _operator);

        l1CrossDomainMessenger = _l1CrossDomainMessenger;
        l1StandardBridge = _l1StandardBridge;
    }

    /**
     * @notice Returns the Optimism chain ID.
     * @inheritdoc ICrossChainAdapterL1
     */
    function getChainId() external pure override returns (uint24) {
        return OPTIMISM_CHAIN_ID;
    }

    /**
     * @notice Receives L2 transaction information via the Optimism bridge.
     * @inheritdoc ICrossChainAdapterL1
     */
    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external {
        require(msg.sender == address(l1CrossDomainMessenger), NotBridge());

        require(
            l1CrossDomainMessenger.xDomainMessageSender() == l2Sender,
            UnauthorizedOriginalSender()
        );

        _handleL2Info(OPTIMISM_CHAIN_ID, _timestamp, _balance, _totalSupply);
    }

    /**
     * @notice Sends ETH to the Vault contract hosted on Optimism Layer 2.
     * @param callValue Amount of ETH to send.
     * @param _gasData ecnoded using bytes Gas parameter: max gas.
     */
    function sendEthToL2(
        uint256 callValue,
        bytes[] calldata _gasData
    ) external payable onlyRebalancer {
        require(callValue <= msg.value, InvalidValue());
        require(l2Receiver != address(0), L2ReceiverNotSet());

        uint256 maxGas;
        if (_gasData.length > 0) {
            (maxGas) = abi.decode(_gasData[0], (uint256));
        } else {
            revert GasDataNotProvided();
        }

        // Use the standard bridge to send ETH to Optimism
        l1StandardBridge.depositETHTo{value: callValue}(
            address(l2Receiver), // L2 receiver address
            uint32(maxGas), // Decoded maxGas from _gasData
            ""
        );

        emit CrossChainTxOptimismSent(callValue);
    }

    /**
     * @notice Receives ETH from Layer 2 and transfers it to the rebalancer.
     * @inheritdoc ICrossChainAdapterL1
     */
    function receiveL2Eth() external payable override {
        require(msg.sender == address(l1CrossDomainMessenger), NotBridge());
        require(rebalancer != address(0), RebalancerNotSet());
        Address.sendValue(payable(rebalancer), msg.value);
        emit L2EthDeposit(msg.value);
    }
}

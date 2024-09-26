// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

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

contract CrossChainAdapterOptimismL1 is
    Initializable,
    OwnableUpgradeable,
    AbstractCrossChainAdapterL1
{
    uint24 public constant OPTIMISM_CHAIN_ID = 10;
    IL1CrossDomainMessenger public l1CrossDomainMessenger;
    IL1StandardBridge public l1StandardBridge;

    function initialize(
        IL1CrossDomainMessenger _l1CrossDomainMessenger,
        IL1StandardBridge _l1StandardBridge,
        address _transactionStorage
    ) public initializer {
        __Ownable_init();
        __AbstractCrossChainAdapterL1_init(_transactionStorage);

        l1CrossDomainMessenger = _l1CrossDomainMessenger;
        l1StandardBridge = _l1StandardBridge;
    }

    function getChainId() external pure override returns (uint24) {
        return OPTIMISM_CHAIN_ID;
    }

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
        handleL2Info(OPTIMISM_CHAIN_ID, _timestamp, _balance, _totalSupply);
    }

    function sendEthToL2(
        uint256 callValue,
        bytes[] calldata _gasData
    ) external payable onlyRebalancer returns (uint256) {
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

        // // NB! if the code block above fails - uncomment the one below
        // PayableCrossDomainMessenger(address(l1CrossDomainMessenger))
        //     .sendMessage{value: msg.value}(l2Receiver, "", uint32(maxGas));

        return 0; // Optimism doesn't return a ticket ID, unlike Arbitrum
    }

    function receiveL2Eth() external payable override {
        require(msg.sender == address(l1CrossDomainMessenger), NotBridge());
        require(rebalancer != address(0), RebalancerNotSet());
        emit L2EthDeposit(msg.value);
        (bool success, ) = rebalancer.call{value: msg.value}("");
        require(success, TransferToRebalancerFailed());
    }
}

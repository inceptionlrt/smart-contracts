// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@eth-optimism/contracts/L1/messaging/IL1CrossDomainMessenger.sol";
import "@eth-optimism/contracts/L1/messaging/IL1StandardBridge.sol";
import "openzeppelin-4/access/Ownable.sol";

import "./AbstractCrossChainAdapterL1.sol";

contract CrossChainAdapterOptimismL1 is AbstractCrossChainAdapterL1 {
    uint24 public constant OPTIMISM_CHAIN_ID = 10;
    IL1CrossDomainMessenger public immutable l1CrossDomainMessenger;
    IL1StandardBridge public immutable l1StandardBridge;
    // mapping(address => string) public greetings;
    uint256 private maxGas = 10_000_000;

    event GasSettingsChanged(uint256 newMaxGas);

    constructor(
        IL1CrossDomainMessenger _l1CrossDomainMessenger,
        IL1StandardBridge _l1StandardBridge,
        address _transactionStorage
    ) AbstractCrossChainAdapterL1(_transactionStorage) {
        l1CrossDomainMessenger = _l1CrossDomainMessenger;
        l1StandardBridge = _l1StandardBridge;
    }

    function getChainId() external pure override returns (uint24) {
        return OPTIMISM_CHAIN_ID;
    }

    // //TODO
    // function sendGreeting(string memory _greeting) public {
    //     l1CrossDomainMessenger.sendMessage(
    //         address(l2Contract),
    //         abi.encodeCall(this.setGreeting, (msg.sender, _greeting)),
    //         200000
    //     );
    // }

    // //TODO
    // function setGreeting(address _sender, string memory _greeting) public {
    //     require(
    //         msg.sender == address(l1CrossDomainMessenger),
    //         "Greeter: Direct sender must be the CrossDomainMessenger"
    //     );

    //     require(
    //         l1CrossDomainMessenger.xDomainMessageSender() ==
    //             address(l2Contract),
    //         "Greeter: Remote sender must be the other Greeter contract"
    //     );

    //     greetings[_sender] = _greeting;
    // }

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

    function sendEthToL2(uint256 callValue) external payable returns (uint256) {
        require(callValue <= msg.value, InvalidValue());
        l1StandardBridge.depositETHTo{value: callValue}(
            address(l2Receiver),
            uint32(maxGas),
            ""
        );

        return 0;
    }

    function setMaxGas(uint256 _maxGas) external onlyOwner {
        require(_maxGas > 0, SettingZeroGas());
        maxGas = _maxGas;
        emit GasSettingsChanged(_maxGas);
    }

    receive() external payable override {
        require(rebalancer != address(0), RebalancerNotSet());
        Address.sendValue(payable(rebalancer), msg.value);
        emit L2EthDeposit(msg.value);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

interface ICrossChainAdapterL1 {
    struct Transaction {
        uint256 timestamp;
        uint256 ethBalance;
        uint256 inEthBalance;
    }

    error NotBridge();
    error FutureTimestamp();
    error UnauthorizedOriginalSender();
    error TransferToRebalancerFailed();
    error SettingZeroAddress();
    error SettingZeroGas();
    error RebalancerNotSet();
    error TxStorageNotSet();
    error InvalidValue();
    error L2ReceiverNotSet();
    error GasDataNotProvided();
    error OnlyRebalancerCanCall(address caller);
    error OnlyOperatorCanCall(address caller);

    event L2EthDeposit(uint256 amount);
    event RebalancerChanged(address newRebalancer);
    event L2ReceiverChanged(address newL2Receiver);
    event L2SenderChanged(address newL2Sender);
    event TxStorageChanged(address newTxStorage);
    event ReceiveTriggered(uint256 amount);

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external;

    function sendEthToL2(
        uint256 callValue,
        bytes[] calldata _gasData
    ) external payable;

    function getChainId() external returns (uint24);

    function recoverFunds() external;

    function receiveL2Eth() external payable;

    receive() external payable;
}

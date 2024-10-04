// // SPDX-License-Identifier: MIT
// pragma solidity 0.8.26;

// interface ICrossChainAdapterL1 {
//     struct Transaction {
//         uint256 timestamp;
//         uint256 ethBalance;
//         uint256 inEthBalance;
//     }

//     error NotBridge();
//     error FutureTimestamp();
//     error UnauthorizedOriginalSender();
//     error TransferToRebalancerFailed();
//     error SettingZeroAddress();
//     error SettingZeroGas();
//     error RebalancerNotSet();
//     error TxStorageNotSet();
//     error InvalidValue();
//     error L2ReceiverNotSet();
//     error GasDataNotProvided();
//     error OnlyRebalancerCanCall(address caller);
//     error OnlyOperatorCanCall(address caller);

//     event L2EthDeposit(uint256 amount);
//     event RebalancerChanged(address prevRebalancer, address newRebalancer);
//     event L2ReceiverChanged(address prevL2Receiver, address newL2Receiver);
//     event L2SenderChanged(address prevL2Sender, address newL2Sender);
//     event TxStorageChanged(address prevTxStorage, address newTxStorage);
//     event ReceiveTriggered(address caller, uint256 amount);
//     event RecoverFundsInitiated(uint256 amount);

//     function receiveL2Info(
//         uint256 _timestamp,
//         uint256 _balance,
//         uint256 _totalSupply
//     ) external;

//     function sendEthToL2(
//         uint256 callValue,
//         bytes[] calldata _gasData
//     ) external payable;

//     function getChainId() external returns (uint24);

//     function recoverFunds() external;

//     function receiveL2Eth() external payable;

//     receive() external payable;
// }

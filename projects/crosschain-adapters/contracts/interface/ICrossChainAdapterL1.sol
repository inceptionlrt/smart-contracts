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
    error NotAuthorizedByL2();
    error TransferToRebalancerFailed();
    error SettingZeroAddress();
    error RebalancerNotSet();
    error TxStorageNotSet();

    event L2InfoReceived(
        uint256 indexed networkId,
        uint256 timestamp,
        uint256 ethBalance,
        uint256 inEthBalance
    );

    event L2EthDeposit(uint256 amount);
    event RebalancerChanged(address newRebalancer);
    event L2SenderChanged(address newL2Sender);
    event InboxChanged(address newInbox);
    event TxStorageChanged(address newTxStorage);

    function ARBITRUM_CHAIN_ID() external returns (uint24);

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external;

    function sendEthToL2(uint256 callValue) external payable returns (uint256);

    function receiveL2Eth() external payable;
}

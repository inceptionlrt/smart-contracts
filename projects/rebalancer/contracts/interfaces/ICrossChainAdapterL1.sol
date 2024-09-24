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

    event L2InfoReceived(
        uint256 indexed networkId,
        uint256 timestamp,
        uint256 ethBalance,
        uint256 inEthBalance
    );

    event L2EthReceived(uint256 indexed value);

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external;

    function sendEthToL2() external payable;

    function receiveL2Eth() external payable;
}

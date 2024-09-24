// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "openzeppelin-4/access/Ownable.sol";
import "openzeppelin-4/security/ReentrancyGuard.sol";
import "openzeppelin-4/utils/Address.sol";

import "../interface/ICrossChainAdapterL1.sol";
import "../interface/ITransactionStorage.sol";

abstract contract AbstractCrossChainAdapter is
    Ownable,
    ICrossChainAdapterL1,
    ReentrancyGuard
{
    address public l2Sender;
    address public inbox;
    address public rebalancer;
    address public transactionStorage;

    constructor(address _transactionStorage) {
        transactionStorage = _transactionStorage;
    }

    function receiveL2Eth() external payable virtual;

    function handleL2Info(
        uint256 _chainId,
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) internal {
        require(rebalancer != address(0), RebalancerNotSet());
        require(transactionStorage != address(0), TxStorageNotSet());
        require(_timestamp <= block.timestamp, FutureTimestamp());

        ITransactionStorage(transactionStorage).handleL2Info(
            _chainId,
            _timestamp,
            _balance,
            _totalSupply
        );

        emit L2InfoReceived(_chainId, _timestamp, _balance, _totalSupply);
    }

    function setRebalancer(address _rebalancer) external virtual onlyOwner {
        require(_rebalancer != address(0), SettingZeroAddress());
        rebalancer = _rebalancer;
        emit RebalancerChanged(_rebalancer);
    }

    function setInbox(address _inbox) external virtual onlyOwner {
        require(_inbox != address(0), SettingZeroAddress());
        inbox = _inbox;
        emit InboxChanged(_inbox);
    }

    function setL2Sender(address _l2Sender) external virtual onlyOwner {
        require(_l2Sender != address(0), SettingZeroAddress());
        l2Sender = _l2Sender;
        emit L2SenderChanged(_l2Sender);
    }

    function setTxStorage(address _txStorage) external virtual onlyOwner {
        require(_txStorage != address(0), SettingZeroAddress());
        transactionStorage = _txStorage;
        emit TxStorageChanged(_txStorage);
    }
}

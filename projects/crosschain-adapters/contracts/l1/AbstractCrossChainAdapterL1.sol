// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "openzeppelin-4/access/Ownable.sol";
import "openzeppelin-4/security/ReentrancyGuard.sol";
import "openzeppelin-4/utils/Address.sol";

import "../interface/ICrossChainAdapterL1.sol";
import "../interface/ITransactionStorage.sol";

abstract contract AbstractCrossChainAdapterL1 is
    Ownable,
    ICrossChainAdapterL1,
    ReentrancyGuard
{
    address public rebalancer;
    address public transactionStorage;
    address public l2Receiver;
    address public l2Sender;

    constructor(address _transactionStorage) {
        transactionStorage = _transactionStorage;
    }

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

    function setTxStorage(address _txStorage) external virtual onlyOwner {
        require(_txStorage != address(0), SettingZeroAddress());
        transactionStorage = _txStorage;
        emit TxStorageChanged(_txStorage);
    }

    function setL2Receiver(address _l2Receiver) external onlyOwner {
        require(_l2Receiver != address(0), SettingZeroAddress());
        l2Receiver = _l2Receiver;
        emit L2ReceiverChanged(_l2Receiver);
    }

    function setL2Sender(address _l2Sender) external onlyOwner {
        require(_l2Sender != address(0), SettingZeroAddress());
        l2Sender = _l2Sender;
        emit L2SenderChanged(_l2Sender);
    }
}
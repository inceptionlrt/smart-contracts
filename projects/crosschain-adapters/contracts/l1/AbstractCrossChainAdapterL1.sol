// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "openzeppelin-4-upgradeable/access/OwnableUpgradeable.sol";
import "openzeppelin-4-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "openzeppelin-4-upgradeable/proxy/utils/Initializable.sol";
import "openzeppelin-4/utils/Address.sol";

import "../interface/ICrossChainAdapterL1.sol";
import "../interface/ITransactionStorage.sol";

abstract contract AbstractCrossChainAdapterL1 is
    Initializable,
    OwnableUpgradeable,
    ICrossChainAdapterL1,
    ReentrancyGuardUpgradeable
{
    address public rebalancer;
    address public transactionStorage;
    address public l2Receiver;
    address public l2Sender;
    address public operator;

    function __AbstractCrossChainAdapterL1_init(
        address _transactionStorage,
        address _operator
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        transactionStorage = _transactionStorage;
        operator = _operator;
    }

    modifier onlyRebalancer() {
        if (msg.sender != rebalancer) {
            revert OnlyRebalancerCanCall(msg.sender);
        }
        _;
    }

    modifier onlyOperator() {
        if (msg.sender != operator) {
            revert OnlyOperatorCanCall(msg.sender);
        }
        _;
    }

    function _handleL2Info(
        uint256 _chainId,
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) internal {
        require(rebalancer != address(0), RebalancerNotSet());
        require(transactionStorage != address(0), TxStorageNotSet());

        ITransactionStorage(transactionStorage).handleL2Info(
            _chainId,
            _timestamp,
            _balance,
            _totalSupply
        );
    }

    function setRebalancer(address _rebalancer) external virtual onlyOwner {
        require(_rebalancer != address(0), SettingZeroAddress());
        rebalancer = _rebalancer;
        address prevRebalancer = rebalancer;
        emit RebalancerChanged(prevRebalancer, _rebalancer);
    }

    function setTxStorage(address _txStorage) external virtual onlyOwner {
        require(_txStorage != address(0), SettingZeroAddress());
        transactionStorage = _txStorage;
        address prevTxStorage = transactionStorage;
        emit TxStorageChanged(prevTxStorage, transactionStorage);
    }

    function setL2Receiver(address _l2Receiver) external onlyOwner {
        require(_l2Receiver != address(0), SettingZeroAddress());
        l2Receiver = _l2Receiver;
        address prevL2Receiver = l2Receiver;
        emit L2ReceiverChanged(prevL2Receiver, _l2Receiver);
    }

    function setL2Sender(address _l2Sender) external onlyOwner {
        require(_l2Sender != address(0), SettingZeroAddress());
        l2Sender = _l2Sender;
        address prevL2Sender = l2Sender;
        emit L2SenderChanged(prevL2Sender, _l2Sender);
    }

    function recoverFunds() external onlyOperator {
        require(rebalancer != address(0), RebalancerNotSet());
        (bool ok, ) = rebalancer.call{value: address(this).balance}("");
        require(ok, TransferToRebalancerFailed());
    }

    receive() external payable {
        emit ReceiveTriggered(msg.sender, msg.value);
    }
}

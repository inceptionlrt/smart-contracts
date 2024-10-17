// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "openzeppelin-4-upgradeable/access/OwnableUpgradeable.sol";
import "openzeppelin-4-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "openzeppelin-4-upgradeable/proxy/utils/Initializable.sol";
import "openzeppelin-4/utils/Address.sol";

import {ICrossChainAdapterL1} from "../interface/ICrossChainAdapterL1.sol";
import {ITransactionStorage} from "../interface/ITransactionStorage.sol";

/**
 * @author The InceptionLRT team
 * @title AbstractCrossChainAdapterL1
 * @dev Abstract base contract for handling cross-chain interactions on L1.
 */
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

    /**
     * @dev Initializes the contract with transaction storage and operator.
     * @param _transactionStorage Address of the transaction storage contract.
     * @param _operator Address of the operator.
     */
    function __AbstractCrossChainAdapterL1_init(
        address _transactionStorage,
        address _operator
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        transactionStorage = _transactionStorage;
        operator = _operator;
    }

    /**
     * @dev Restricts access to the rebalancer.
     */
    modifier onlyRebalancer() {
        if (msg.sender != rebalancer) {
            revert OnlyRebalancerCanCall(msg.sender);
        }
        _;
    }

    /**
     * @dev Restricts access to the operator.
     */
    modifier onlyOperator() {
        if (msg.sender != operator) {
            revert OnlyOperatorCanCall(msg.sender);
        }
        _;
    }

    /**
     * @dev Handles L2 information and saves it in the transaction storage.
     * @param _chainId The chain ID of the L2 network (Arbitrum, Optimism etc).
     * @param _timestamp The block.timestamp of the original message.
     * @param _balance The ETH balance of the L2 Vault.
     * @param _totalSupply The total supply of inETH on L2 Vault.
     */
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

    /**
     * @notice Updates the Rebalancer address.
     * @param _rebalancer Address of the new rebalancer.
     */
    function setRebalancer(address _rebalancer) external virtual onlyOwner {
        require(_rebalancer != address(0), SettingZeroAddress());
        emit RebalancerChanged(rebalancer, _rebalancer);
        rebalancer = _rebalancer;
    }

    /**
     * @notice Updates the transaction storage address.
     * @param _txStorage Address of the new transaction storage.
     */
    function setTxStorage(address _txStorage) external virtual onlyOwner {
        require(_txStorage != address(0), SettingZeroAddress());
        emit TxStorageChanged(transactionStorage, _txStorage);
        transactionStorage = _txStorage;
    }

    /**
     * @notice Updates the L2 receiver address (Vault).
     * @param _l2Receiver Address of the new L2 receiver.
     */
    function setL2Receiver(address _l2Receiver) external onlyOwner {
        require(_l2Receiver != address(0), SettingZeroAddress());
        address prevL2Receiver = l2Receiver;
        l2Receiver = _l2Receiver;
        emit L2ReceiverChanged(prevL2Receiver, _l2Receiver);
    }

    /**
     * @notice Updates the L2 sender address (L2 Crosschain adapter).
     * @param _l2Sender Address of the new L2 sender.
     */
    function setL2Sender(address _l2Sender) external onlyOwner {
        require(_l2Sender != address(0), SettingZeroAddress());
        address prevL2Sender = l2Sender;
        l2Sender = _l2Sender;
        emit L2SenderChanged(prevL2Sender, _l2Sender);
    }

    /**
     * @notice Transfers contract funds to the rebalancer in the unlikely case of accumulation of dust ETH values.
     */
    function recoverFunds() external onlyOperator {
        require(rebalancer != address(0), RebalancerNotSet());
        uint256 amount = address(this).balance;
        (bool ok, ) = rebalancer.call{value: amount}("");
        require(ok, TransferToRebalancerFailed());
        emit RecoverFundsInitiated(amount);
    }

    /**
     * @notice Receive ETH and trigger an event.
     */
    receive() external payable {
        emit ReceiveTriggered(msg.sender, msg.value);
        Address.sendValue(payable(rebalancer), msg.value);
    }
}

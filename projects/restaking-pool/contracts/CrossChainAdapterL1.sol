// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ICrossChainAdapterL1} from "./interfaces/ICrossChainAdapterL1.sol";
import {ICrossChainBridge} from "./interfaces/ICrossChainBridge.sol";
import {ITransactionStorage} from "./interfaces/ITransactionStorage.sol";

contract CrossChainAdapterL1 is
    Initializable,
    ICrossChainAdapterL1,
    OwnableUpgradeable
{
    address public crosschainBridge;
    address public rebalancer;
    address public transactionStorage;

    modifier onlyCrosschainBridge() {
        if (msg.sender != crosschainBridge && msg.sender != owner()) {
            revert NotBridge(msg.sender);
        }
        _;
    }

    modifier onlyRebalancer() {
        if (msg.sender != rebalancer && msg.sender != owner()) {
            revert NotRebalancer(msg.sender);
        }
        _;
    }

    /// @dev This replaces the constructor, and can be called only once during initialization
    function initialize(
        address _crosschainBridge,
        address _rebalancer,
        address _transactionStorage
    ) public initializer {
        require(
            _crosschainBridge != address(0) &&
                _rebalancer != address(0) &&
                _transactionStorage != address(0),
            SettingZeroAddress()
        );
        __Ownable_init(msg.sender);
        crosschainBridge = _crosschainBridge;
        rebalancer = _rebalancer;
        transactionStorage = _transactionStorage;
    }

    /// @dev Called by Rebalancer to send ETH to L2.
    function sendEthToL2(
        uint256 _chainId
    ) external payable override onlyRebalancer {
        ICrossChainBridge(crosschainBridge).sendCrosschain{value: msg.value}(
            _chainId,
            "",
            ""
        );
    }

    function quoteSendEth(
        uint256 _chainId
    ) external view override returns (uint256) {
        return ICrossChainBridge(crosschainBridge).quoteSendEth(_chainId);
    }

    /// @dev Receives the decoded L2 info and calls the storage handler.
    function handleCrossChainData(
        uint256 _chainId,
        bytes calldata _payload
    ) public override {
        require(transactionStorage != address(0), TxStorageNotSet());
        (
            uint256 timestamp,
            uint256 balance,
            uint256 totalSupply
        ) = _decodeCalldata(_payload);
        if (timestamp > block.timestamp) {
            revert FutureTimestamp();
        }

        ITransactionStorage(transactionStorage).handleL2Info(
            _chainId,
            timestamp,
            balance,
            totalSupply
        );
    }

    /// @dev Receives ETH from L2 and transfers it to the rebalancer.
    function receiveCrosschainEth(uint256 _chainId) external payable override {
        emit L2EthDeposit(_chainId, msg.value);
        Address.sendValue(payable(rebalancer), msg.value);
    }

    /// @dev Allows recovering stuck funds to the rebalancer.
    function recoverFunds() external override onlyOwner {
        require(rebalancer != address(0), RebalancerNotSet());
        uint256 amount = address(this).balance;
        (bool success, ) = rebalancer.call{value: amount}("");
        require(success, TransferToRebalancerFailed());
        emit RecoverFundsInitiated(amount);
    }

    function setCrossChainBridge(
        address _newCrossChainBridge
    ) external onlyOwner {
        require(_newCrossChainBridge != address(0), SettingZeroAddress());
        emit CrossChainBridgeChanged(crosschainBridge, _newCrossChainBridge);
        crosschainBridge = _newCrossChainBridge;
    }

    function setRebalancer(address _newRebalancer) external onlyOwner {
        require(_newRebalancer != address(0), SettingZeroAddress());
        emit RebalancerChanged(rebalancer, _newRebalancer);
        rebalancer = _newRebalancer;
    }

    function setTransactionStorage(address _newTxStorage) external onlyOwner {
        require(_newTxStorage != address(0), SettingZeroAddress());
        emit TxStorageChanged(transactionStorage, _newTxStorage);
        transactionStorage = _newTxStorage;
    }

    /// @dev Decodes L2 data and processes it.
    function _decodeCalldata(
        bytes calldata payload
    ) internal pure returns (uint256, uint256, uint256) {
        (uint256 timestamp, uint256 balance, uint256 totalSupply) = abi.decode(
            payload,
            (uint256, uint256, uint256)
        );
        return (timestamp, balance, totalSupply);
    }

    receive() external payable override {
        emit ReceiveTriggered(msg.sender, msg.value);
        Address.sendValue(payable(rebalancer), msg.value);
    }
}

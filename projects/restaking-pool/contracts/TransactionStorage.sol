// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Rebalancer.sol";
import "crosschain-adapters/contracts/interface/ICrossChainAdapterL1.sol";

/**
 * @author The InceptionLRT team
 * @title TransactionStorage
 * @dev Stores and manages Layer 2 transaction data and chain-specific adapters.
 */
contract TransactionStorage is Ownable {
    struct Transaction {
        uint256 timestamp;
        uint256 ethBalance;
        uint256 inEthBalance;
    }

    mapping(uint256 => Transaction) public txs;
    mapping(uint256 => address) public adapters;
    uint32[] public chainIds;

    event L2InfoReceived(
        uint256 indexed networkId,
        uint256 timestamp,
        uint256 ethBalance,
        uint256 inEthBalance
    );

    event AdapterAdded(uint256 indexed chainId, address adapterAddress);
    event AdapterReplaced(
        uint256 indexed chainId,
        address oldAdapterAddress,
        address newAdapterAddress
    );

    error MsgNotFromAdapter(address caller);
    error ChainIdAlreadyExists(uint256 chainId);
    error AdapterAlreadyExists(uint256 chainId);
    error NoAdapterForThisChainId(uint256 chainId);
    error TimeCannotBeInFuture(uint256 timestamp);
    error TimeBeforePrevRecord(uint256 timestamp);

    /**
     * @dev Initializes the contract with the owner's address.
     * @param _owner The address of the contract owner.
     */
    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Adds a new Chain ID to the storage.
     * @dev Ensures that the Chain ID does not already exist in the list.
     * @param _newChainId The Chain ID to add.
     */
    function addChainId(uint32 _newChainId) external onlyOwner {
        for (uint i = 0; i < chainIds.length; i++) {
            if (chainIds[i] == _newChainId) {
                revert ChainIdAlreadyExists(chainIds[i]);
            }
        }
        chainIds.push(_newChainId);
    }

    /**
     * @notice Handles Layer 2 information and updates the transaction data for a specific Chain ID.
     * @dev Verifies that the caller is the correct adapter and that the timestamp is valid.
     * @param _chainId The Chain ID of the transaction.
     * @param _timestamp The timestamp when the transaction occurred.
     * @param _balance The ETH balance involved in the transaction.
     * @param _totalSupply The total inETH supply for the transaction.
     */
    function handleL2Info(
        uint256 _chainId,
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external {
        require(
            _timestamp <= block.timestamp,
            TimeCannotBeInFuture(_timestamp)
        );
        require(
            msg.sender == adapters[_chainId],
            MsgNotFromAdapter(msg.sender)
        );

        Transaction memory lastUpdate = txs[_chainId];
        if (lastUpdate.timestamp != 0) {
            require(
                _timestamp > lastUpdate.timestamp,
                TimeBeforePrevRecord(_timestamp)
            );
        }

        Transaction memory newUpdate = Transaction({
            timestamp: _timestamp,
            ethBalance: _balance,
            inEthBalance: _totalSupply
        });

        txs[_chainId] = newUpdate;

        emit L2InfoReceived(_chainId, _timestamp, _balance, _totalSupply);
    }

    /**
     * @notice Retrieves the transaction for a specific Chain ID. NB! Only one (last) transaction is stored.
     * @param _chainId The Chain ID for which to retrieve the last transaction data.
     * @return The transaction data (timestamp, ETH balance, inETH balance).
     */
    function getTransactionData(
        uint256 _chainId
    ) external view returns (Transaction memory) {
        return txs[_chainId];
    }

    /**
     * @notice Returns all stored Chain IDs (and henceforth - all supported networks).
     * @return An array containing all Chain IDs stored in the contract.
     */
    function getAllChainIds() external view returns (uint32[] memory) {
        return chainIds;
    }

    /**
     * @notice Adds a new adapter for a specific Chain ID.
     * @dev Ensures that no adapter is already assigned to the Chain ID.
     * @param _chainId The Chain ID for which the adapter is added.
     * @param _adapterAddress The address of the adapter.
     */
    function addAdapter(
        uint256 _chainId,
        address _adapterAddress
    ) external onlyOwner {
        require(
            adapters[_chainId] == address(0),
            AdapterAlreadyExists(_chainId)
        );
        adapters[_chainId] = _adapterAddress;

        emit AdapterAdded(_chainId, _adapterAddress);
    }

    /**
     * @notice Replaces an existing adapter for a specific Chain ID.
     * @dev Ensures that an adapter already exists for the Chain ID before replacing it.
     * @param _chainId The Chain ID for which the adapter is being replaced.
     * @param _newAdapterAddress The new adapter address to replace the old one.
     */
    function replaceAdapter(
        uint256 _chainId,
        address _newAdapterAddress
    ) external onlyOwner {
        address prevAdapterAddress = adapters[_chainId];
        require(
            prevAdapterAddress != address(0),
            NoAdapterForThisChainId(_chainId)
        );

        adapters[_chainId] = _newAdapterAddress;

        emit AdapterReplaced(_chainId, prevAdapterAddress, _newAdapterAddress);
    }
}

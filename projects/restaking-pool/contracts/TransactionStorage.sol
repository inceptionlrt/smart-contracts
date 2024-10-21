// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

import {Rebalancer} from "./Rebalancer.sol";
import {ITransactionStorage} from "./interfaces/ITransactionStorage.sol";
import {ICrossChainAdapterL1} from "./interfaces/ICrossChainAdapterL1.sol";

/**
 * @author The InceptionLRT team
 * @title TransactionStorage
 * @dev Stores and manages Layer 2 transaction data and chain-specific adapters.
 */
contract TransactionStorage is Ownable, ITransactionStorage {
    mapping(uint256 => Transaction) public txs;
    address public adapter;
    uint32[] public chainIds;

    modifier onlyAdapter() {
        require(
            msg.sender == adapter || msg.sender == owner(),
            MsgNotFromAdapter(msg.sender)
        );
        _;
    }

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
    ) external onlyAdapter {
        require(
            _timestamp <= block.timestamp,
            TimeCannotBeInFuture(_timestamp)
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
     * @dev Replaces the crosschain adapters
     * @param _newAdapter The address of the adapter.
     */
    function setAdapter(address _newAdapter) external onlyOwner {
        require(_newAdapter != address(0), SettingZeroAddress());

        emit AdapterChanged(adapter, _newAdapter);
        adapter = _newAdapter;
    }
}

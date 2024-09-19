// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./Rebalancer.sol";
import "./interfaces/ICrossChainAdapter.sol";

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

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Add a new Chain ID to the storage
     * @param _newChainId The new Chain ID to add
     */
    function addChainId(uint32 _newChainId) external {
        for (uint i = 0; i < chainIds.length; i++) {
            if (chainIds[i] == _newChainId) {
                revert("Chain ID already exists");
            }
        }
        chainIds.push(_newChainId);
    }

    /**
     * @notice Handle Layer 2 information and update transaction data
     * @param _chainId The Chain ID of the transaction
     * @param _timestamp The timestamp of the transaction
     * @param _balance The balance of the transaction
     * @param _totalSupply The total supply for the transaction
     */
    function handleL2Info(
        uint256 _chainId,
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external {
        require(_timestamp <= block.timestamp, "Time cannot be in the future");
        require(
            msg.sender == adapters[_chainId],
            MsgNotFromAdapter(msg.sender)
        );

        Transaction memory lastUpdate = txs[_chainId];
        if (lastUpdate.timestamp != 0) {
            require(
                _timestamp > lastUpdate.timestamp,
                "Time before than prev recorded"
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
     * @notice Get transaction data for a specific Chain ID
     * @param _chainId The Chain ID to retrieve the transaction data for
     * @return The transaction data for the specified Chain ID
     */
    function getTransactionData(
        uint256 _chainId
    ) external view returns (Transaction memory) {
        return txs[_chainId];
    }

    /**
     * @notice Get all stored Chain IDs
     * @return An array of all stored Chain IDs
     */
    function getAllChainIds() external view returns (uint32[] memory) {
        return chainIds;
    }

    /**
     * @notice Add a new adapter for a specific Chain ID
     * @param _chainId The Chain ID associated with the adapter
     * @param _adapterAddress The address of the adapter to add
     */
    function addAdapter(
        uint256 _chainId,
        address _adapterAddress
    ) external onlyOwner {
        require(
            adapters[_chainId] == address(0),
            "Adapter already exists for this Chain ID"
        );
        adapters[_chainId] = _adapterAddress;

        emit AdapterAdded(_chainId, _adapterAddress);
    }

    function replaceAdapter(
        uint256 _chainId,
        address _newAdapterAddress
    ) external onlyOwner {
        address prevAdapterAddress = adapters[_chainId];
        require(
            prevAdapterAddress != address(0),
            "Adapter does not exist for this Chain ID"
        );

        adapters[_chainId] = _newAdapterAddress;

        emit AdapterReplaced(_chainId, prevAdapterAddress, _newAdapterAddress);
    }
}

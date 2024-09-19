// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

interface ITransactionStorage {
    struct Transaction {
        uint256 timestamp;
        uint256 ethBalance;
        uint256 inEthBalance;
    }

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

    /**
     * @notice Add a new Chain ID to the storage
     * @param newChainId The new Chain ID to add
     */
    function addChainId(uint32 newChainId) external;

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
    ) external;

    /**
     * @notice Get transaction data for a specific Chain ID
     * @param chainId The Chain ID to retrieve the transaction data for
     * @return The transaction data for the specified Chain ID
     */
    function getTransactionData(
        uint256 chainId
    ) external view returns (Transaction memory);

    /**
     * @notice Get all stored Chain IDs
     * @return An array of all stored Chain IDs
     */
    function getAllChainIds() external view returns (uint32[] memory);

    /**
     * @notice Add a new adapter for a specific Chain ID
     * @param chainId The Chain ID associated with the adapter
     * @param adapterAddress The address of the adapter to add
     */
    function addAdapter(uint256 chainId, address adapterAddress) external;

    /**
     * @notice Replace an existing adapter for a specific Chain ID
     * @param _chainId The Chain ID associated with the adapter
     * @param _newAdapterAddress The new address of the adapter
     */
    function replaceAdapter(
        uint256 _chainId,
        address _newAdapterAddress
    ) external;
}

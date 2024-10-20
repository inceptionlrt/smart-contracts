// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

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

    function addChainId(uint32 newChainId) external;

    function handleL2Info(
        uint256 _chainId,
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external;

    function getTransactionData(
        uint256 chainId
    ) external view returns (Transaction memory);

    function getAllChainIds() external view returns (uint32[] memory);

    function addAdapter(uint256 chainId, address adapterAddress) external;

    function replaceAdapter(
        uint256 _chainId,
        address _newAdapterAddress
    ) external;
}

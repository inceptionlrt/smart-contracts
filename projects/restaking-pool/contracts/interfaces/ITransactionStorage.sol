// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IRebalancer {
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

    event AdapterChanged(address oldAdapterAddress, address newAdapterAddress);

    error MsgNotFromAdapter(address caller);
    error ChainIdAlreadyExists(uint256 chainId);
    error AdapterAlreadyExists(uint256 chainId);
    error NoAdapterForThisChainId(uint256 chainId);
    error TimeCannotBeInFuture(uint256 timestamp);
    error TimeBeforePrevRecord(uint256 timestamp);
    error SettingZeroAddress();

    function addChainId(uint32 _newChainId) external;

    function handleL2Info(
        uint256 _chainId,
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external;

    function getTransactionData(
        uint256 _chainId
    ) external view returns (Transaction memory);

    function getAllChainIds() external view returns (uint32[] memory);

    function setAdapter(address payable _newAdapter) external;
}

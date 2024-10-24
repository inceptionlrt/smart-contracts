// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IRebalancer {
    struct Transaction {
        uint256 timestamp;
        uint256 ethBalance;
        uint256 inEthBalance;
    }

    // Events
    event L2InfoReceived(
        uint256 indexed networkId,
        uint256 timestamp,
        uint256 ethBalance,
        uint256 inEthBalance
    );
    event BridgeChanged(address oldBridgeAddress, address newBridgeAddress);
    event ETHReceived(address sender, uint256 amount);
    event ETHDepositedToLiquidPool(address liquidPool, uint256 amountETH);
    event InETHDepositedToLockbox(uint256 mintAmount);
    event TreasuryUpdateMint(uint256 mintAmount);
    event TreasuryUpdateBurn(uint256 mintAmount);
    event LockboxChanged(address prevLockbox, address newLockbox);
    event InEthChanged(address prevInEth, address newInEth);
    event LiqPoolChanged(address prevLiqPool, address newLiqPool);
    event OperatorChanged(address prevOperator, address newOperator);

    // Errors
    error MsgNotFromBridge(address caller);
    error ChainIdAlreadyExists(uint256 chainId);
    error BridgeAlreadyExists(uint256 chainId);
    error NoBridgeForThisChainId(uint256 chainId);
    error TimeCannotBeInFuture(uint256 timestamp);
    error TimeBeforePrevRecord(uint256 timestamp);
    error SettingZeroAddress();
    error TransferToLockboxFailed();
    error InETHAddressNotSet();
    error LiquidityPoolNotSet();
    error CrosschainBridgeNotSet();
    error MissingOneOrMoreL2Transactions(uint256 chainId);
    error StakeAmountExceedsEthBalance(uint256 staked, uint256 availableEth);
    error SendAmountExceedsEthBalance(uint256 amountToSend);
    error StakeAmountExceedsMaxTVL();
    error OnlyOperator();
    error NoRebalancingRequired();

    // Functions
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

    function setBridge(address payable _newBridge) external;

    function setInETHAddress(address _inETHAddress) external;

    function setLockboxAddress(address _lockboxAddress) external;

    function updateTreasuryData() external;

    function inETHAddress() external view returns (address);

    function lockboxAddress() external view returns (address);

    function liqPool() external view returns (address payable);

    function ratioFeed() external view returns (address);

    function operator() external view returns (address);

    function bridge() external view returns (address payable);
}

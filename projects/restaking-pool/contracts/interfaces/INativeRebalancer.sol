// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface INativeRebalancer {
    struct Transaction {
        uint256 timestamp;
        uint256 ethBalance;
        uint256 inceptionTokenBalance;
    }

    // Events
    event L2InfoReceived(
        uint256 indexed networkId,
        uint256 timestamp,
        uint256 ethBalance,
        uint256 inceptionTokenBalance
    );
    event ETHReceived(address sender, uint256 amount);
    event ETHDepositedToLiquidPool(address liquidPool, uint256 amountETH);
    event InceptionTokenDepositedToLockbox(uint256 mintAmount);
    event TreasuryUpdateMint(uint256 mintAmount);
    event TreasuryUpdateBurn(uint256 mintAmount);
    event LockboxChanged(address prevLockbox, address newLockbox);
    event InceptionTokenChanged(
        address prevInceptionToken,
        address newInceptionToken
    );
    event LiqPoolChanged(address prevLiqPool, address newLiqPool);
    event OperatorChanged(address prevOperator, address newOperator);
    event BridgeAdded(uint256 indexed chainId, address newAdapter);
    event DefaultBridgeChanged(
        address indexed prevDefaultAdapter,
        address indexed newDefaultAdapter
    );
    event ChainIdDelted(uint256 index);

    error MsgNotFromBridge(address caller);
    error ChainIdAlreadyExists(uint256 chainId);
    error BridgeAlreadyExists(uint256 chainId);
    error NoBridgeForThisChainId(uint256 chainId);
    error TimeCannotBeInFuture(uint256 timestamp);
    error TimeBeforePrevRecord(uint256 timestamp);
    error SettingZeroAddress();
    error TransferToLockboxFailed();
    error InceptionTokenAddressNotSet();
    error LiquidityPoolNotSet();
    error CrosschainBridgeNotSet();
    error MissingOneOrMoreL2Transactions(uint256 chainId);
    error StakeAmountExceedsEthBalance(uint256 staked, uint256 availableEth);
    error SendAmountExceedsEthBalance(uint256 amountToSend);
    error StakeAmountExceedsMaxTVL();
    error OnlyOperator();
    error NoRebalancingRequired();
    error IndexOutOfBounds(uint256 index, uint256 length);
    error NoAdapterAvailable(uint256 _chainId);

    function handleL2Info(
        uint256 _chainId,
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external;

    function getTransactionData(
        uint256 _chainId
    ) external view returns (Transaction memory);

    function setDefaultAdapter(address payable _newDefaultAdapter) external;

    function setInceptionToken(address _inceptionTokenAddress) external;

    function setLockboxAddress(address _lockboxAddress) external;

    function updateTreasuryData() external;

    function inceptionToken() external view returns (address);

    function lockboxAddress() external view returns (address);

    function liqPool() external view returns (address payable);

    function ratioFeed() external view returns (address);

    function operator() external view returns (address);

    function defaultAdapter() external view returns (address payable);
}

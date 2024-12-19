// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IRebalancer {
    struct Transaction {
        uint256 timestamp;
        uint256 underlyingBalance;
        uint256 inceptionTokenSupply;
    }

    /**************************
     ********* Events *********
     **************************/

    event L2InfoReceived(
        uint256 indexed networkId,
        uint256 timestamp,
        uint256 underlyingBalance,
        uint256 inceptionTokenSupply
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
    event UnderlyingAssetChanged(address prevUnderlyingAsset, address newUnderlyingAsset);
    event LiqPoolChanged(address prevLiqPool, address newLiqPool);
    event RatioFeedChanged(address prevValue, address newValue);
    event OperatorChanged(address prevOperator, address newOperator);
    event AdapterAdded(uint256 indexed chainId, address newAdapter);
    event DefaultBridgeChanged(
        address indexed prevDefaultAdapter,
        address indexed newDefaultAdapter
    );
    event SyncedSupplyChanged(
        uint256 prevSyncedSupply,
        uint256 nextSyncedSupply
    );
    event UpdateableChanged(bool prevUpdateable, bool nextUpdateable);
    event ChainIdAdded(uint256 chainId);
    event ChainIdDeleted(uint256 chainId, uint256 index);
    event TransferToRestakingPool(uint256 amount);

    error MsgNotFromBridge(address caller);
    error ChainIdAlreadyExists(uint256 chainId);
    error ChainIdNotFound(uint256 chainId);
    error BridgeAlreadyExists(uint256 chainId);
    error NoBridgeForThisChainId(uint256 chainId);
    error TimeCannotBeInFuture(uint256 timestamp);
    error TimeBeforePrevRecord(uint256 timestamp);
    error SettingZeroAddress();
    error TransferToRestakingPoolFailed();
    error TransferToLockboxFailed();
    error InceptionTokenAddressNotSet();
    error LiquidityPoolNotSet();
    error CrosschainBridgeNotSet();
    error MissingOneOrMoreL2Transactions(uint256 chainId);
    error StakeAmountExceedsEthBalance(uint256 staked, uint256 availableEth);
    error SendAmountExceedsEthBalance(uint256 amountToSend);
    error StakeAmountExceedsMaxTVL();
    error OnlyOperator();
    error OnlyAdapter();
    error NoRebalancingRequired();
    error IndexOutOfBounds(uint256 index, uint256 length);
    error NoAdapterAvailable(uint256 _chainId);
    error TreasuryUpdatesPaused();
    error NoChainIdsConfigured();

    // function handleL2Info(
    //     uint256 _chainId,
    //     uint256 _timestamp,
    //     uint256 _balance,
    //     uint256 _totalSupply
    // ) external;

    // function getTransactionData(
    //     uint256 _chainId
    // ) external view returns (Transaction memory);

    // function setDefaultAdapter(address payable _newDefaultAdapter) external;

    // //function setInceptionToken(address _inceptionTokenAddress) external;

    // //function setLockboxAddress(address _lockboxAddress) external;

    // function updateTreasuryData() external;

    // function inceptionToken() external view returns (address);

    // function lockboxAddress() external view returns (address);

    // function liqPool() external view returns (address payable);

    // function ratioFeed() external view returns (address);

    // function operator() external view returns (address);

    // function defaultAdapter() external view returns (address payable);
}

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
    event DefaultAdapterChanged(
        address indexed prevDefaultAdapter,
        address indexed newDefaultAdapter
    );
    event DefaultChainIdChanged(
        uint256 indexed prevValue,
        uint256 indexed newValue
    );
    event SyncedSupplyChanged(
        uint256 prevSyncedSupply,
        uint256 nextSyncedSupply
    );
    event UpdateableChanged(bool prevUpdateable, bool nextUpdateable);
    event ChainIdAdded(uint256 chainId);
    event ChainIdDeleted(uint256 chainId, uint256 index);
    event TransferToRestakingPool(uint256 amount);
    event TransferToInceptionVault(uint256 amount);
    event AssetInfoTxMaxDelayChanged(uint256 delay);

    error MsgNotFromBridge(address caller);
    error ChainIdAlreadyExists(uint256 chainId);
    error ChainIdNotFound(uint256 chainId);
    error BridgeAlreadyExists(uint256 chainId);
    error NoBridgeForThisChainId(uint256 chainId);
    error TimeCannotBeInFuture(uint256 timestamp);
    error TimeBeforePrevRecord(uint256 timestamp);
    error SettingZeroAddress();
    error SettingZeroChainId();
    error SettingZeroDelay();
    error TransferToRestakingPoolFailed();
    error TransferToLockboxFailed();
    error InceptionTokenAddressNotSet();
    error LiquidityPoolNotSet();
    error InceptionVaultNotSet();
    error CrosschainBridgeNotSet();
    error MissingOneOrMoreL2Transactions(uint256 chainId);
    error OutdatedAssetInfo(uint256 chainId);
    error StakeAmountExceedsEthBalance(uint256 staked, uint256 availableEth);
    error StakeAmountExceedsBalance(uint256 stakedAmount, uint256 availableAmount);
    error SendAmountExceedsEthBalance(uint256 amountToSend);
    error StakeAmountExceedsMaxTVL();
    error OnlyOperator();
    error OnlyAdapter();
    error NoRebalancingRequired();
    error IndexOutOfBounds(uint256 index, uint256 length);
    error NoAdapterAvailable(uint256 _chainId);
    error TreasuryUpdatesPaused();
    error NoChainIdsConfigured();
}

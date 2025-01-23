// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.24;

/**
 * @title IMellowSymbioticVault
 * @notice Interface for the Mellow Symbiotic Vault.
 */
interface IMellowSymbioticVault {
    /**
     * @notice Struct to store initialization parameters for the vault.
     * @param limit The maximum limit for deposits.
     * @param symbioticCollateral The address of the underlying Symbiotic Collateral.
     * @param symbioticVault The address of the underlying Symbiotic Vault.
     * @param withdrawalQueue The address of the associated withdrawal queue.
     * @param admin The address of the vault's admin.
     * @param depositPause Indicates whether deposits are paused initially.
     * @param withdrawalPause Indicates whether withdrawals are paused initially.
     * @param depositWhitelist Indicates whether a deposit whitelist is enabled initially.
     * @param name The name of the vault token.
     * @param symbol The symbol of the vault token.
     */
    struct InitParams {
        uint256 limit;
        address symbioticCollateral;
        address symbioticVault;
        address withdrawalQueue;
        address admin;
        bool depositPause;
        bool withdrawalPause;
        bool depositWhitelist;
        string name;
        string symbol;
    }

    /**
     * @notice Initializes the vault with the provided parameters.
     * @param initParams The initialization parameters.
     *
     * @custom:requirements
     * - The vault MUST not have been initialized before this call.
     */
    function initialize(InitParams memory initParams) external;

    /**
     * @notice Returns the amount of `asset` that can be claimed by a specific account.
     * @param account The address of the account.
     * @return claimableAssets The amount of claimable assets.
     */
    function claimableAssetsOf(address account) external view returns (uint256 claimableAssets);

    /**
     * @notice Returns the amount of `asset` that is in the withdrawal queue for a specific account.
     * @param account The address of the account.
     * @return pendingAssets The amount of pending assets that cannot be claimed yet.
     */
    function pendingAssetsOf(address account) external view returns (uint256 pendingAssets);

    /**
     * @notice Finalizes the withdrawal process for an account and transfers assets to the recipient.
     * @param account The address of the account initiating the withdrawal.
     * @param recipient The address of the recipient receiving the assets.
     * @param maxAmount The maximum amount of assets to withdraw.
     * @return shares The actual number of shares claimed.
     *
     * @custom:requirements
     * - The `account` MUST be equal to `msg.sender`.
     *
     * @custom:effects
     * - Finalizes the withdrawal process and transfers up to `maxAmount` of `asset` to the `recipient`.
     */
    function claim(address account, address recipient, uint256 maxAmount)
        external
        returns (uint256);

    /**
     * @notice Deposits available assets into the Symbiotic Vault and collateral according to their capacities.
     * @return collateralWithdrawal The amount of collateral withdrawn to match the Symbiotic Vault deposit requirements.
     * @return collateralDeposit The amount of assets deposited into the collateral.
     * @return vaultDeposit The amount of assets deposited into the Symbiotic Vault.
     *
     * @dev This function first calculates the appropriate amounts to withdraw and deposit using `_calculatePushAmounts`.
     *      It then performs the necessary withdrawals and deposits, adjusting allowances as needed.
     *      Finally, it emits a `SymbioticPushed` event with the results.
     * @custom:effects
     * - Deposits assets into the Symbiotic Vault and collateral according to their capacities.
     * - Prioritizes Symbiotic Vault deposits over collateral deposits.
     * - If required withdraws collateral to match the Symbiotic Vault deposit requirements.
     * - Emits the `SymbioticPushed` event.
     */
    function pushIntoSymbiotic()
        external
        returns (uint256 collateralWithdrawal, uint256 collateralDeposit, uint256 vaultDeposit);

    /**
     * @notice Pushes rewards to the Farm and Curator of the vault for a specified farm ID.
     * @param farmId The ID of the farm.
     * @param symbioticRewardsData The data specific to the Symbiotic Vault's `claimRewards()` method.
     *
     * @custom:effects
     * - Transfers a portion of the Symbiotic Vault's reward token to the Curator as a fee.
     * - The remaining rewards are pushed to the Farm.
     * - Emits the `RewardsPushed` event.
     */
    function pushRewards(uint256 farmId, bytes calldata symbioticRewardsData) external;

    /**
     * @notice Returns the full balance details for a specific account.
     * @param account The address of the account.
     * @return accountAssets The total amount of assets belonging to the account.
     * @return accountInstantAssets The amount of assets that can be withdrawn instantly.
     * @return accountShares The total amount of shares belonging to the account.
     * @return accountInstantShares The amount of shares that can be withdrawn instantly.
     */
    function getBalances(address account)
        external
        view
        returns (
            uint256 accountAssets,
            uint256 accountInstantAssets,
            uint256 accountShares,
            uint256 accountInstantShares
        );

    /**
     * @notice Emitted when rewards are pushed to the Farm and Curator treasury.
     * @param farmId The ID of the farm.
     * @param rewardAmount The amount of rewards pushed.
     * @param curatorFee The fee taken by the curator.
     * @param timestamp The time at which the rewards were pushed.
     */
    event RewardsPushed(
        uint256 indexed farmId, uint256 rewardAmount, uint256 curatorFee, uint256 timestamp
    );

    /**
     * @notice Emitted when assets are pushed from the vault into the Symbiotic Vault.
     * @param sender The address that initiated the push.
     * @param vaultAmount The amount of assets pushed to the Symbiotic Vault.
     * @param collateralDeposit The amount of collateral deposited.
     * @param collateralWithdrawal The amount of collateral withdrawn.
     */
    event SymbioticPushed(
        address sender, uint256 collateralWithdrawal, uint256 collateralDeposit, uint256 vaultAmount
    );
}
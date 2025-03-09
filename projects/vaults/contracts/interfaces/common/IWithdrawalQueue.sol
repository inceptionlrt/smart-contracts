// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IWithdrawalQueueErrors {
    error UndelegateExceedRequested();
    error UndelegateEpochMismatch();
    error ClaimUnknownAdapter();
    error AdapterVaultAlreadyUndelegated();
    error AdapterAlreadyClaimed();
    error ClaimedExceedUndelegated();
    error UndelegateNotCompleted();
    error ValueZero();
    error OnlyVaultAllowed();
    error InsufficientFreeReservedRedeemAmount();
}

interface IWithdrawalQueue is IWithdrawalQueueErrors {
    struct WithdrawalEpoch {
        bool ableRedeem;

        uint256 totalRequestedShares;
        uint256 totalClaimedAmount;
        uint256 totalUndelegatedAmount;
        uint256 totalUndelegatedShares;

        mapping(address => bool) userRedeemed;
        mapping(address => uint256) userShares;
        mapping(address => mapping(address => uint256)) adapterUndelegated;
        mapping(address => mapping(address => uint256)) adapterClaimed;

        uint256 adaptersUndelegatedCounter;
        uint256 adaptersClaimedCounter;
    }

    /// @notice Requests a withdrawal for a receiver in the current epoch
    /// @param receiver The address requesting the withdrawal
    /// @param shares The number of shares to request for withdrawal
    function request(address receiver, uint256 shares) external;

    /// @notice Processes undelegation for multiple adapters and vaults in a given epoch
    /// @param epoch The epoch to undelegate from (must match current epoch)
    /// @param adapters Array of adapter addresses
    /// @param vaults Array of vault addresses
    /// @param shares Array of share amounts to undelegate
    /// @param undelegatedAmounts Array of undelegated amounts
    /// @param claimedAmounts Array of claimed amounts
    function undelegate(
        uint256 epoch,
        address[] calldata adapters,
        address[] calldata vaults,
        uint256[] calldata shares,
        uint256[] calldata undelegatedAmounts,
        uint256[] calldata claimedAmounts
    ) external;

    /// @notice Claims an amount for a specific adapter and vault in an epoch
    /// @param epoch The epoch to claim from
    /// @param adapter The adapter address
    /// @param vault The vault address
    /// @param claimedAmount The amount to claim
    function claim(uint256 epoch, address adapter, address vault, uint256 claimedAmount) external;

    /// @notice Forces undelegation and claims a specified amount for the current epoch.
    /// @param epoch The epoch number to process, must match the current epoch.
    /// @param claimedAmount The amount to claim, must not exceed totalAmountRedeemFree.
    function forceUndelegateAndClaim(uint256 epoch, uint256 claimedAmount) external;

    /// @notice Redeems available amounts for a receiver across their epochs
    /// @param receiver The address to redeem for
    /// @return amount The total amount redeemed
    function redeem(address receiver) external returns (uint256 amount);

    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    /// @notice Returns the emergency epoch number
    /// @return The emergency epoch number
    function EMERGENCY_EPOCH() external view returns (uint64);

    /// @notice Returns the current epoch number
    /// @return The current epoch number
    function currentEpoch() external view returns (uint256);

    /// @notice Returns the total amount queued for withdrawal
    /// @return The total amount to withdraw
    function totalAmountToWithdraw() external view returns (uint256);

    /// @notice Returns the total amount that has been undelegated
    /// @return The total undelegated amount
    function totalAmountUndelegated() external view returns (uint256);

    /// @notice Returns the total amount that has been redeemed
    /// @return The total redeemed amount
    function totalAmountRedeem() external view returns (uint256);

    /// @notice Returns the not reserved amount of total amount to redeem;
    /// @return The total redeemed amount
    function totalAmountRedeemFree() external view returns (uint256);

    /// @notice Returns the total pending withdrawal amount for a receiver
    /// @param receiver The address to check
    /// @return amount The total pending withdrawal amount
    function getPendingWithdrawalOf(address receiver) external view returns (uint256 amount);

    /// @notice Checks if a claimer has redeemable withdrawals and their epoch indexes
    /// @param claimer The address to check
    /// @return able Whether there are redeemable withdrawals
    /// @return withdrawalIndexes Array of epoch indexes with redeemable withdrawals
    function isRedeemable(address claimer) external view returns (bool able, uint256[] memory withdrawalIndexes);

    /// @notice Retrieves the total number of requested shares for a specific epoch.
    /// @param epoch The epoch number for which to retrieve the requested shares.
    /// @return The total number of shares requested in the specified epoch.
    function getRequestedShares(uint256 epoch) external view returns (uint256);
}
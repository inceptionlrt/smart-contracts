// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.24;

/**
 * @title IVaultConfigurator
 * @notice Contract defining the configuration and access control for a vault system.
 *         This interface specifies the parameters for the primary Vault contract,
 *         facilitating secure configuration updates through a two-stage process: staging and committing, with each parameter update subject to a specified delay.
 *         The stage function sets the new value and timestamp for the parameter, while the commit function finalizes the update
 *
 *         The delay parameter is expressed in seconds and is defined for each parameter of this contract as follows:
 *            - baseDelay: the base delay for stage/commit operations
 *            - depositCallbackDelay: delay for changing the deposit callback contract address
 *            - withdrawalCallbackDelay: delay for changing the withdrawal callback contract address
 *            - withdrawalFeeD9Delay: delay for changing the withdrawal fee
 *            - isDepositLockedDelay: delay for locking deposits
 *            - areTransfersLockedDelay: delay for locking LP token transfers
 *            - delegateModuleApprovalDelay: delay for approving delegated modules
 *            - maximalTotalSupplyDelay: delay for changing the maximum total supply
 *            - ratiosOracleDelay: delay for changing the ratios oracle address
 *            - priceOracleDelay: delay for changing the price oracle address
 *            - validatorDelay: delay for changing the validator address
 *            - emergencyWithdrawalDelay: delay for withdrawing funds after calling registerWithdrawal
 *
 *         Each of the above parameters has a pair of functions, stage/commit, through which their updates occur. The delay for all these parameters is set to baseDelay.
 *
 *         With the exception of functions for isDepositLocked parameter, all mutable functions of the contract can only be called by the vault's admin.
 *         Function for isDepositLocked parameter can be called by either the operator or the vault's admin
 *         to enable faster deposit locking if deemed necessary from the operator/strategy standpoint.
 */
interface IMellowVaultConfigurator {
    /// @dev Errors
    error AddressZero();
    error InvalidDelay();
    error InvalidTimestamp();
    error InvalidWithdrawalFee();
    error InvalidTotalSupply();

    /// @notice Struct to represent a staged data change with a delay period.
    struct Data {
        uint256 value; // Current value
        uint256 stagedValue; // Staged value waiting to be committed
        uint256 stageTimestamp; // Timestamp of staging
    }

    /// @notice Returns the maximum allowed delay for any staged data.
    /// @return uint256 The constant `MAX_DELAY` indicating the maximum delay period (365 days).
    function MAX_DELAY() external pure returns (uint256);

    /// @notice Returns the maximum withdrawal fee allowed.
    /// @return uint256 The constant `MAX_WITHDRAWAL_FEE` indicating the maximum withdrawal fee (5%).
    function MAX_WITHDRAWAL_FEE() external pure returns (uint256);

    /// @notice Returns the address of the vault associated with this configurator.
    /// @return address of the vault contract.
    function vault() external view returns (address);

    ///@notice Stages an approval for the specified delegate module.
    /// @param module The address of the module to approve.
    function stageDelegateModuleApproval(address module) external;

    /// @notice Commits the previously staged delegate module approval after the delay period.
    /// @param module The address of the module to approve.
    function commitDelegateModuleApproval(address module) external;

    /// @notice Rolls back any staged delegate module approval.
    /// @param module The address of the module to roll back.
    function rollbackStagedDelegateModuleApproval(address module) external;

    /// @notice @notice Revokes the approval of the specified delegate module.
    /// @param module The address of the module to revoke approval from.
    function revokeDelegateModuleApproval(address module) external;

    /// @notice Returns the base delay value for all staging operations.
    /// @return uint256 The base delay value in seconds.
    function baseDelay() external view returns (uint256);

    /// @notice Checks if the specified delegate module is approved for use.
    /// @param module The address of the module to check.
    /// @return bool `true` if the module is approved, otherwise `false`.
    function isDelegateModuleApproved(
        address module
    ) external view returns (bool);

    /// @notice Returns whether deposits are currently locked.
    /// @notice operator owned parameter.
    /// @return bool `true` if deposits are locked, otherwise `false`.
    function isDepositLocked() external view returns (bool);

    /// @notice Returns whether LP token transfers are currently locked.
    /// @notice admin owned parameter.
    /// @return bool `true` if transfers are locked, otherwise `false`.
    function areTransfersLocked() external view returns (bool);

    /// @notice Returns the maximum total supply of LP tokens allowed.
    /// @return uint256 The maximum total supply of LP tokens.
    function maximalTotalSupply() external view returns (uint256);

    /// @notice Returns the address of the deposit callback contract.
    /// @return address The address of the deposit callback contract.
    function depositCallback() external view returns (address);

    /// @notice Returns the address of the withdrawal callback contract.
    /// @return address The address of the withdrawal callback contract.
    function withdrawalCallback() external view returns (address);

    /// @notice Returns the current withdrawal fee in D9 format.
    /// @return uint256 The withdrawal fee, represented as an integer with 9 decimal places.
    function withdrawalFeeD9() external view returns (uint256);

    /// @notice Returns the delay for committing deposit callback changes.
    /// @return uint256 The delay in seconds.
    function depositCallbackDelay() external view returns (uint256);

    /// @notice Returns the delay for committing withdrawal callback changes.
    /// @return uint256 The delay in seconds.
    function withdrawalCallbackDelay() external view returns (uint256);

    /// @notice Returns the delay for committing withdrawal fee changes.
    /// @return uint256 The delay in seconds.
    function withdrawalFeeD9Delay() external view returns (uint256);

    /// @notice Returns the delay for committing deposit locks.
    /// @return uint256 The delay in seconds.
    function isDepositLockedDelay() external view returns (uint256);

    /// @notice Returns the delay for committing transfers locks.
    /// @return uint256 The delay in seconds.
    function areTransfersLockedDelay() external view returns (uint256);

    /// @notice Returns the delay for committing delegate module approvals.
    /// @return uint256 The delay in seconds.
    function delegateModuleApprovalDelay() external view returns (uint256);

    /// @notice Returns the delay for committing maximum total supply changes.
    /// @return uint256 The delay in seconds.
    function maximalTotalSupplyDelay() external view returns (uint256);

    /// @notice Returns the address of the ratios oracle.
    /// @return address The address of the ratios oracle.
    function ratiosOracle() external view returns (address);

    /// @notice Returns the address of the price oracle.
    /// @return address The address of the price oracle.
    function priceOracle() external view returns (address);

    /// @notice Returns the address of the validator.
    /// @return address The address of the validator.
    function validator() external view returns (address);

    /// @notice Returns the delay for committing validator changes.
    /// @return uint256 The delay in seconds.
    function validatorDelay() external view returns (uint256);

    /// @notice Returns the delay for committing price oracle changes.
    /// @return uint256 The delay in seconds.
    function priceOracleDelay() external view returns (uint256);

    /// @notice Returns the delay for committing ratios oracle changes.
    /// @return uint256 The delay in seconds.
    function ratiosOracleDelay() external view returns (uint256);

    /// @notice Returns the delay required between calling `registerWithdrawal` and being able to perform an emergency withdrawal for that request.
    /// @return uint256 The minimum delay time, in seconds, that a user must wait after calling `registerWithdrawal` before executing an emergency withdrawal.
    function emergencyWithdrawalDelay() external view returns (uint256);

    /// @notice Stages the deposits lock by setting a staged value and timestamp.
    function stageDepositsLock() external;

    /// @notice Commits the previously staged deposits lock after the delay period.
    function commitDepositsLock() external;

    /// @notice Rolls back any staged deposits lock.
    function rollbackStagedDepositsLock() external;

    /// @notice Revokes the current deposits lock, unlocking deposits.
    function revokeDepositsLock() external;

    /// @notice Stages the transfers lock by setting a staged value and timestamp.
    /// @param flag The new value to stage.
    function stageTransfersLock(bool flag) external;

    /// @notice Commits the previously staged transfers lock after the delay period.
    function commitTransfersLock() external;

    /// @notice Rolls back any staged transfers lock.
    function rollbackStagedTransfersLock() external;

    /// @notice Stages the maximum total supply with a staged value and timestamp.
    /// @param maximalTotalSupply_ The maximum total supply to stage.
    function stageMaximalTotalSupply(uint256 maximalTotalSupply_) external;

    /// @notice Commits the previously staged maximum total supply after the delay period.
    function commitMaximalTotalSupply() external;

    /// @notice Rolls back any staged maximum total supply changes.
    function rollbackStagedMaximalTotalSupply() external;

    /// @notice Stages a new deposit callback address.
    /// @param callback The address of the new deposit callback contract.
    function stageDepositCallback(address callback) external;

    /// @notice Commits the previously staged deposit callback address after the delay period.
    function commitDepositCallback() external;

    /// @notice Rolls back any staged deposit callback changes.
    function rollbackStagedDepositCallback() external;

    /// @notice Stages a new withdrawal callback address.
    /// @param callback The address of the new withdrawal callback contract.
    function stageWithdrawalCallback(address callback) external;

    /// @notice Commits the previously staged withdrawal callback address after the delay period.
    function commitWithdrawalCallback() external;

    /// @notice Rolls back any staged withdrawal callback changes.
    function rollbackStagedWithdrawalCallback() external;

    /// @notice Stages a new withdrawal fee in D9 format.
    /// @param feeD9 The new withdrawal fee in D9 format.
    function stageWithdrawalFeeD9(uint256 feeD9) external;

    /// @notice Commits the previously staged withdrawal fee after the delay period.
    function commitWithdrawalFeeD9() external;

    /// @notice Rolls back any staged withdrawal fee changes.
    function rollbackStagedWithdrawalFeeD9() external;

    /// @notice Stages a base delay value.
    /// @param delay_ The base delay value to stage.
    function stageBaseDelay(uint256 delay_) external;

    /// @notice Commits the previously staged base delay after the delay period.
    function commitBaseDelay() external;

    /// @notice Rolls back any staged base delay changes.
    function rollbackStagedBaseDelay() external;

    /// @notice Stages a delay value for the deposit callback.
    /// @param delay_ The delay value to stage.
    function stageDepositCallbackDelay(uint256 delay_) external;

    /// @notice Commits the previously staged deposit callback delay after the delay period.
    function commitDepositCallbackDelay() external;

    /// @notice Rolls back any staged deposit callback delay changes.
    function rollbackStagedDepositCallbackDelay() external;

    /// @notice Stages a delay value for the withdrawal callback.
    /// @param delay_ The delay value to stage.
    function stageWithdrawalCallbackDelay(uint256 delay_) external;

    /// @notice Commits the previously staged withdrawal callback delay after the delay period.
    function commitWithdrawalCallbackDelay() external;

    /// @notice Rolls back any staged withdrawal callback delay changes.
    function rollbackStagedWithdrawalCallbackDelay() external;

    /// @notice Stages a delay value for the withdrawal fee in D9 format.
    /// @param delay_ The delay value to stage.
    function stageWithdrawalFeeD9Delay(uint256 delay_) external;

    /// @notice Commits the previously staged withdrawal fee delay after the delay period.
    function commitWithdrawalFeeD9Delay() external;

    /// @notice Rolls back any staged withdrawal fee delay changes.
    function rollbackStagedWithdrawalFeeD9Delay() external;

    /// @notice Stages a delay value for locking deposits.
    /// @param delay_ The delay value to stage.
    function stageDepositsLockedDelay(uint256 delay_) external;

    /// @notice Commits the previously staged deposits lock delay after the delay period.
    function commitDepositsLockedDelay() external;

    /// @notice Rolls back any staged deposits lock delay changes.
    function rollbackStagedDepositsLockedDelay() external;

    /// @notice Stages a delay value for locking transfers.
    /// @param delay_ The delay value to stage.
    function stageTransfersLockedDelay(uint256 delay_) external;

    /// @notice Commits the previously staged transfers lock delay after the delay period.
    function commitTransfersLockedDelay() external;

    /// @notice Rolls back any staged transfers lock delay changes.
    function rollbackStagedTransfersLockedDelay() external;

    /// @notice Stages a delay value for the delegate module approval.
    /// @param delay_ The delay value to stage.
    function stageDelegateModuleApprovalDelay(uint256 delay_) external;

    /// @notice Commits the previously staged delegate module approval delay after the delay period.
    function commitDelegateModuleApprovalDelay() external;

    /// @notice Rolls back any staged delegate module approval delay changes.
    function rollbackStagedDelegateModuleApprovalDelay() external;

    /// @notice Stages a delay value for the maximum total supply.
    /// @param delay_ The delay value to stage.
    function stageMaximalTotalSupplyDelay(uint256 delay_) external;

    /// @notice Commits the previously staged maximum total supply delay after the delay period.
    function commitMaximalTotalSupplyDelay() external;

    /// @notice Rolls back any staged maximum total supply delay changes.
    function rollbackStagedMaximalTotalSupplyDelay() external;

    /// @notice Stages a ratios oracle address.
    /// @param oracle The address of the new ratios oracle.
    function stageRatiosOracle(address oracle) external;

    /// @notice Commits the previously staged ratios oracle after the delay period.
    function commitRatiosOracle() external;

    /// @notice Rolls back any staged ratios oracle changes.
    function rollbackStagedRatiosOracle() external;

    /// @notice Stages a price oracle address.
    /// @param oracle The address of the new price oracle.
    function stagePriceOracle(address oracle) external;

    /// @notice Commits the previously staged price oracle after the delay period.
    function commitPriceOracle() external;

    /// @notice Rolls back any staged price oracle changes.
    function rollbackStagedPriceOracle() external;

    /// @notice Stages a validator address.
    /// @param validator_ The address of the new validator.
    function stageValidator(address validator_) external;

    /// @notice Commits the previously staged validator after the delay period.
    function commitValidator() external;

    /// @notice Rolls back any staged validator changes.
    function rollbackStagedValidator() external;

    /// @notice Stages a delay value for the validator.
    /// @param delay_ The delay value to stage.
    function stageValidatorDelay(uint256 delay_) external;

    /// @notice Commits the previously staged validator delay after the delay period.
    function commitValidatorDelay() external;

    /// @notice Rolls back any staged validator delay changes.
    function rollbackStagedValidatorDelay() external;

    /// @notice Stages a delay value for the price oracle.
    /// @param delay_ The delay value to stage.
    function stagePriceOracleDelay(uint256 delay_) external;

    /// @notice Commits the previously staged price oracle delay after the delay period.
    function commitPriceOracleDelay() external;

    /// @notice Rolls back any staged price oracle delay changes.
    function rollbackStagedPriceOracleDelay() external;

    /// @notice Stages a delay value for the ratios oracle.
    /// @param delay_ The delay value to stage.
    function stageRatiosOracleDelay(uint256 delay_) external;

    /// @notice Commits the previously staged ratios oracle delay after the delay period.
    function commitRatiosOracleDelay() external;

    /// @notice Rolls back any staged ratios oracle delay changes.
    function rollbackStagedRatiosOracleDelay() external;

    /// @notice Stages a delay value for emergency withdrawals.
    /// @param delay_ The delay value to stage.
    function stageEmergencyWithdrawalDelay(uint256 delay_) external;

    /// @notice Commits the previously staged emergency withdrawal delay.
    function commitEmergencyWithdrawalDelay() external;

    /// @notice Rolls back any staged emergency withdrawal delay changes.
    function rollbackStagedEmergencyWithdrawalDelay() external;

    /// @dev Emitted when a value is staged for future commitment for given slot.
    event Stage(
        bytes32 indexed slot,
        Data indexed data,
        uint256 value,
        uint256 timestamp
    );

    /// @dev Emitted when a staged value is committed and updated for given slot.
    event Commit(bytes32 indexed slot, Data indexed data, uint256 timestamp);

    /// @dev Emitted when a staged value is rolled back without commitment for given slot.
    event Rollback(bytes32 indexed slot, Data indexed data, uint256 timestamp);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAdapterHandler
 * @dev Interface for handling delegation, undelegation, and adapter-related operations in a staking system.
 */
interface IAdapterHandler {
    /**
     * @dev Emitted when a staker delegates an amount to an operator.
     * @param stakerAddress The address of the staker who initiates the delegation.
     * @param operatorAddress The address of the operator receiving the delegation.
     * @param amount The amount of tokens delegated.
     */
    event DelegatedTo(
        address indexed stakerAddress,
        address indexed operatorAddress,
        uint256 amount
    );

    /**
     * @dev Emitted when a staker undelegates funds from an adapter and vault.
     * @param adapter The address of the adapter contract involved in undelegation.
     * @param vault The address of the vault from which funds are undelegated.
     * @param actualAmounts The actual amount of tokens undelegated.
     * @param claimedAmount The amount claimed during the undelegation process.
     * @param epoch The epoch in which the undelegation occurred.
     */
    event UndelegatedFrom(
        address indexed adapter,
        address indexed vault,
        uint256 indexed actualAmounts,
        uint256 claimedAmount,
        uint256 epoch
    );

    /**
     * @dev Emitted when a staker claims funds from an adapter and vault.
     * @param adapter The address of the adapter contract involved in the claim.
     * @param vault The address of the vault from which funds are claimed.
     * @param claimedAmount The amount of tokens claimed.
     * @param epoch The epoch in which the claim occurred.
     */
    event ClaimedFrom(
        address indexed adapter,
        address indexed vault,
        uint256 claimedAmount,
        uint256 epoch
    );

    /**
     * @dev Emitted when the target capacity of the system is changed.
     * @param prevValue The previous target capacity value.
     * @param newValue The new target capacity value.
     */
    event TargetCapacityChanged(uint256 prevValue, uint256 newValue);

    /**
     * @dev Emitted when a new adapter is added to the system.
     * @param adapter The address of the newly added adapter.
     */
    event AdapterAdded(address adapter);

    /**
     * @dev Emitted when an adapter is removed from the system.
     * @param adapter The address of the removed adapter.
     */
    event AdapterRemoved(address adapter);

    /**
     * @dev Deprecated structure representing a withdrawal request.
     * @param epoch The epoch in which the withdrawal was requested.
     * @param receiver The address receiving the withdrawn funds.
     * @param amount The amount of tokens requested for withdrawal.
     */
    struct __deprecated_Withdrawal {
        uint256 epoch;
        address receiver;
        uint256 amount;
    }
}
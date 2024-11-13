// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IDepositCallback
 * @notice Interface defining a callback function to handle deposit results.
 */
interface IDepositCallback {
    /**
     * @notice Handles the callback after a deposit operation has been executed.
     * @param actualAmounts An array representing the actual amounts of each token that were deposited.
     * @param lpAmount The total amount of LP tokens that were issued as a result of the deposit.
     * @dev This function is intended to be implemented by contracts that need to take further action following a deposit.
     */
    function depositCallback(
        uint256[] memory actualAmounts,
        uint256 lpAmount
    ) external;
}
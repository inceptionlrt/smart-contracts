// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

/**
 * @title IWithdrawalCallback
 * @notice Interface defining a callback function to handle post-withdrawal actions in processWithdrawals function.
 */
interface IWithdrawalCallback {
    /**
     * @notice Handles the callback after a withdrawal operation has been executed.
     * @dev This function should be implemented to carry out any additional actions required after the withdrawal.
     *      It does not take any parameters and will be invoked once the withdrawal process is complete.
     */
    function withdrawalCallback() external;
}
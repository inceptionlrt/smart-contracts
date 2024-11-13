// SPDX-License-Identifier: BSL-1.1
pragma solidity 0.8.25;

/**
 * @title IValidator
 * @notice Interface defining a generic validator for transaction data.
 */
interface IValidator {
    /**
     * @notice Validates a transaction involving two addresses based on the provided calldata.
     * @param from The address initiating the transaction.
     * @param to The target address of the transaction.
     * @param data The transaction data containing the function selector and any necessary parameters.
     * @dev Implementers should validate that the transaction is authorized, properly formatted, and adheres to the required business logic.
     *      Reverts if the transaction is invalid.
     */
    function validate(
        address from,
        address to,
        bytes calldata data
    ) external view;
}
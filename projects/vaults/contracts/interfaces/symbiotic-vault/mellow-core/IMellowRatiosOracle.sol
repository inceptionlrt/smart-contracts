// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

/**
 * @title IRatiosOracle
 * @notice Interface for a ratios oracle, providing the target allocation ratios for a vault.
 */
interface IMellowRatiosOracle {
    /**
     * @notice Retrieves the target allocation ratios (using 96-bit precision) for a specific vault's tokens.
     * @param vault The address of the vault requesting the ratios.
     * @param isDeposit A boolean indicating whether the ratios are for a deposit or a withdrawal.
     * @return ratiosX96 An array representing the target ratios for each token, expressed in 96-bit precision.
     * @dev The array of ratios should align with the underlying tokens associated with the vault.
     *      Reverts if the ratios cannot be provided due to missing or mismatched data.
     */
    function getTargetRatiosX96(
        address vault,
        bool isDeposit
    ) external view returns (uint128[] memory ratiosX96);
}

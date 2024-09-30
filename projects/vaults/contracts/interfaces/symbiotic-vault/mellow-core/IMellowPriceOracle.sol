// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.24;

/**
 * @title IPriceOracle
 * @notice Interface defining a standard price oracle that provides token prices in 96-bit precision.
 */
interface IMellowPriceOracle {
    /**
     * @notice Returns the price of a specific token relative to the base token of the given vault, expressed in 96-bit precision.
     * @param vault The address of the vault requesting the price.
     * @param token The address of the token to calculate the price for.
     * @return priceX96_ The price of the token relative to the base token, using 96-bit precision.
     * @dev Implementations should ensure prices are accurate and may involve external oracle data.
     *      Reverts with an appropriate error if the price cannot be provided.
     */
    function priceX96(
        address vault,
        address token
    ) external view returns (uint256 priceX96_);
}

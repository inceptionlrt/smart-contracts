// SPDX-License-Identifier: BSL-1.1
pragma solidity 0.8.25;

/**
 * @title ITvlModule
 * @notice Interface for a Total Value Locked (TVL) module, providing information about token balances.
 */
interface ITvlModule {
    // Structure representing TVL data for a token
    struct Data {
        address token; // Address of the token
        address underlyingToken; // Address of the underlying token
        uint256 amount; // Current amount of the token
        uint256 underlyingAmount; // Current amount of the underlying token
        bool isDebt; // Flag indicating if the token represents debt
    }

    /**
     * @notice Returns Total Value Locked (TVL) data for a specific user.
     * @param user The address of the user.
     * @return data An array of TVL data for each token held by the user.
     */
    function tvl(address user) external view returns (Data[] memory data);
}
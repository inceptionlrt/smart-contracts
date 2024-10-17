// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.20;


/**
 * @title IDefaultBondStrategy
 * @notice Interface defining the functions for managing bond strategies with deposits and withdrawals.
 *   The contract of the basic defaultBond strategy, the only operations of which are deposits into various bonds in a specified proportion
 *   and processing of user withdrawals. Note that this strategy allows users to make instant withdrawals when calling processWithdrawals([msg.sender]).
 */
interface IDefaultBondStrategy {
    /// @dev Errors
    error InvalidCumulativeRatio();
    error InvalidBond();

    /**
     * @notice Structure representing data for a specific bond allocation.
     * @param bond The address of the bond to allocate funds to.
     * @param ratioX96 The proportion of funds to allocate to this bond, using a 96-bit precision ratio.
     */
    struct Data {
        address bond;
        uint256 ratioX96;
    }

    /**
     * @notice Returns the constant Q96, which is used as a multiplier for ratio calculations.
     * @return The value of Q96 (2^96) for ratio calculations.
     */
    function Q96() external view returns (uint256);

    /**
     * @notice Returns the bond data associated with a specific token address.
     * @param token The address of the token.
     * @return bytes The bond data encoded as bytes.
     */
    function tokenToData(address token) external view returns (bytes memory);

    /**
     * @notice Sets the bond allocation data for a specific token.
     * @param token The address of the token to associate with bond data.
     * @param data An array of `Data` structures representing the bond allocation details.
     * @dev The cumulative ratio of all bond allocations should sum up to `Q96`.
     */
    function setData(address token, Data[] memory data) external;

    /**
     * @notice Processes all pending withdrawals for all users.
     * Withdraws from bonds and processes through the vault.
     */
    function processAll() external;

    /**
     * @notice Processes withdrawals for a specific list of users.
     * Withdraws from bonds and processes through the vault.
     * @param users An array of user addresses to process withdrawals for.
     */
    function processWithdrawals(address[] memory users) external;

    /**
     * @notice Emitted when bond allocation data is set for a specific token in the Default Bond Strategy.
     * @param token The address of the token for which bond allocation data is set.
     * @param data An array of `Data` structures representing the bond allocation details.
     * @param timestamp The timestamp when the bond allocation data is set.
     */
    event DefaultBondStrategySetData(
        address indexed token,
        IDefaultBondStrategy.Data[] data,
        uint256 timestamp
    );

    /**
     * @notice Emitted when withdrawals are processed for a list of users in the Default Bond Strategy.
     * @param users An array of user addresses for whom withdrawals are processed.
     * @param timestamp The timestamp when the withdrawals are processed.
     */
    event DefaultBondStrategyProcessWithdrawals(
        address[] users,
        uint256 timestamp
    );
}

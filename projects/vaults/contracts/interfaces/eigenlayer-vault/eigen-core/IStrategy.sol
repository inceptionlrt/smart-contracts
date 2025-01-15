// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStrategyErrors {
    /// @dev Thrown when called by an account that is not strategy manager.
    error OnlyStrategyManager();
    /// @dev Thrown when new shares value is zero.
    error NewSharesZero();
    /// @dev Thrown when total shares exceeds max.
    error TotalSharesExceedsMax();
    /// @dev Thrown when amount shares is greater than total shares.
    error WithdrawalAmountExceedsTotalDeposits();
    /// @dev Thrown when attempting an action with a token that is not accepted.
    error OnlyUnderlyingToken();

    /// StrategyBaseWithTVLLimits

    /// @dev Thrown when `maxPerDeposit` exceeds max.
    error MaxPerDepositExceedsMax();
    /// @dev Thrown when balance exceeds max total deposits.
    error BalanceExceedsMaxTotalDeposits();
}

interface IStrategyBase is IStrategyErrors {
    function deposit(IERC20 token, uint256 amount) external returns (uint256);

    function withdraw(
        address depositor,
        IERC20 token,
        uint256 amountShares
    ) external;

    function sharesToUnderlying(
        uint256 amountShares
    ) external returns (uint256);

    function underlyingToShares(
        uint256 amountUnderlying
    ) external returns (uint256);

    function userUnderlying(address user) external returns (uint256);

    function sharesToUnderlyingView(
        uint256 amountShares
    ) external view returns (uint256);

    function underlyingToSharesView(
        uint256 amountUnderlying
    ) external view returns (uint256);

    /**
     * @notice convenience function for fetching the current underlying value of all of the `user`'s shares in
     * this strategy. In contrast to `userUnderlying`, this function guarantees no state modifications
     */
    function userUnderlyingView(address user) external view returns (uint256);

    /// @notice The underlying token for shares in this Strategy
    function underlyingToken() external view returns (IERC20);

    /// @notice The total number of extant shares in this Strategy
    function totalShares() external view returns (uint256);

    /// @notice Returns either a brief string explaining the strategy's goal & purpose, or a link to metadata that explains in more detail.
    function explanation() external view returns (string memory);
}

interface IStrategy is IStrategyBase {
    /// @notice Simple getter function that returns the current values of `maxPerDeposit` and `maxTotalDeposits`.
    function getTVLLimits() external view returns (uint256, uint256);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract StrategyBaseDummy {
    function deposit(
        IERC20 token,
        uint256 amount
    ) external payable returns (uint256) {}

    function withdraw(
        address depositor,
        IERC20 token,
        uint256 amountShares
    ) external {}

    function sharesToUnderlying(
        uint256 amountShares
    ) external returns (uint256) {}

    function underlyingToShares(
        uint256 amountUnderlying
    ) external returns (uint256) {}

    function userUnderlying(address user) external returns (uint256) {}

    function sharesToUnderlyingView(
        uint256 amountShares
    ) external view returns (uint256) {}

    function underlyingToSharesView(
        uint256 amountUnderlying
    ) external view returns (uint256) {}

    /**
     * @notice convenience function for fetching the current underlying value of all of the `user`'s shares in
     * this strategy. In contrast to `userUnderlying`, this function guarantees no state modifications
     */
    function userUnderlyingView(address user) external view returns (uint256) {}

    /// @notice The underlying token for shares in this Strategy
    function underlyingToken() external view returns (IERC20) {}

    /// @notice The total number of extant shares in this Strategy
    function totalShares() external view returns (uint256) {}

    /// @notice Returns either a brief string explaining the strategy's goal & purpose, or a link to metadata that explains in more detail.
    function explanation() external view returns (string memory) {}
}

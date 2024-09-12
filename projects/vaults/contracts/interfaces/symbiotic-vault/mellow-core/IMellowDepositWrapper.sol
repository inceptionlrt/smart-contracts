// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./IMellowVault.sol";

/**
 * @title IMellowDepositWrapper
 * @notice Interface defining the functions for wrapping tokens before deposit into a vault.
 */
interface IMellowDepositWrapper {
    /// @dev Errors
    error AddressZero();
    error InvalidToken();
    error InvalidAmount();
    error InvalidTokenList();
    error InvalidSender();

    /**
     * @notice Returns the address of the WETH token.
     * @return The address of the WETH token.
     */
    function weth() external view returns (address);

    /**
     * @notice Returns the address of the stETH token.
     * @return The address of the stETH token.
     */
    function steth() external view returns (address);

    /**
     * @notice Returns the address of the wstETH token.
     * @return The address of the wstETH token.
     */
    function wsteth() external view returns (address);

    /**
     * @notice Returns the address of the vault to which deposits are made.
     * @return The address of the vault.
     */
    function vault() external view returns (IMellowVault);

    /**
     * @notice Deposits specified tokens into the vault, converting them to the required format if necessary.
     * @param to The address that will receive the resulting LP tokens.
     * @param token The address of the token to deposit (can be WETH, stETH, wstETH, or ETH).
     * @param amount The amount of tokens to deposit.
     * @param minLpAmount The minimum number of LP tokens expected from the deposit.
     * @param deadline The deadline timestamp for the deposit transaction.
     * @return lpAmount The amount of LP tokens obtained from the deposit.
     */
    function deposit(
        address to,
        address token,
        uint256 amount,
        uint256 minLpAmount,
        uint256 deadline
    ) external payable returns (uint256 lpAmount);

    /**
     * @notice Emitted when a deposit is executed in the Deposit Wrapper contract.
     * @param sender The address of the account initiating the deposit.
     * @param token The address of the token being deposited.
     * @param amount The amount of the token being deposited.
     * @param lpAmount The amount of LP tokens received after the deposit.
     * @param deadline The deadline by which the deposit must be executed.
     */
    event DepositWrapperDeposit(
        address indexed sender,
        address token,
        uint256 amount,
        uint256 lpAmount,
        uint256 deadline
    );
}

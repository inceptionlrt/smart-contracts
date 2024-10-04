// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./IXERC20.sol";

interface IXERC20LockboxErrors {
    /// @notice Reverts when a user tries to deposit native tokens on a non-native lockbox
    error IXERC20Lockbox_NotNative();

    /// @notice Reverts when a user tries to deposit non-native tokens on a native lockbox
    error IXERC20Lockbox_Native();

    /// @notice Reverts when a user tries to withdraw and the call fails
    error IXERC20Lockbox_WithdrawFailed();

    /// @notice Reverts when a user tries to withdraw to the XERC20Lockbox itself
    error IXERC20Lockbox_WrongReceiver();
}

interface IXERC20Lockbox is IXERC20LockboxErrors {
    /**
     * @notice Emitted when tokens are deposited into the lockbox
     *
     * @param _sender The address of the user who deposited
     * @param _amount The amount of tokens deposited
     */
    event Deposit(address _sender, uint256 _amount);

    /**
     * @notice Emitted when tokens are withdrawn from the lockbox
     *
     * @param _sender The address of the user who withdrew
     * @param _amount The amount of tokens withdrawn
     */
    event Withdraw(address _sender, uint256 _amount);

    function XERC20() external view returns (IXERC20 xerc20);

    function ERC20() external view returns (IERC20 erc20);

    /**
     * @notice Deposit ERC20 tokens into the lockbox
     *
     * @param _amount The amount of tokens to deposit
     */
    function deposit(uint256 _amount) external;

    /**
     * @notice Deposit ERC20 tokens into the lockbox, and send the XERC20 to a user
     *
     * @param _user The user to send the XERC20 to
     * @param _amount The amount of tokens to deposit
     */
    function depositTo(address _user, uint256 _amount) external;

    /**
     * @notice Deposit the native asset into the lockbox, and send the XERC20 to a user
     *
     * @param _user The user to send the XERC20 to
     */
    function depositNativeTo(address _user) external payable;

    /**
     * @notice Withdraw ERC20 tokens from the lockbox
     *
     * @param _amount The amount of tokens to withdraw
     */
    function withdraw(uint256 _amount) external;

    /**
     * @notice Withdraw ERC20 tokens from the lockbox
     *
     * @param _user The user to withdraw to
     * @param _amount The amount of tokens to withdraw
     */
    function withdrawTo(address _user, uint256 _amount) external;
}

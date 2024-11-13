// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.25;

import "./interfaces/IDepositWrapper.sol";

contract DepositWrapper is IDepositWrapper {
    using SafeERC20 for IERC20;

    /// @inheritdoc IDepositWrapper
    address public immutable weth;
    /// @inheritdoc IDepositWrapper
    address public immutable steth;
    /// @inheritdoc IDepositWrapper
    address public immutable wsteth;
    /// @inheritdoc IDepositWrapper
    IVault public immutable vault;

    constructor(IVault vault_, address weth_, address steth_, address wsteth_) {
        vault = vault_;
        weth = weth_;
        steth = steth_;
        wsteth = wsteth_;
    }

    function _wethToWsteth(uint256 amount) private returns (uint256) {
        IWeth(weth).withdraw(amount);
        return _ethToWsteth(amount);
    }

    function _ethToWsteth(uint256 amount) private returns (uint256) {
        ISteth(steth).submit{value: amount}(address(0));
        return _stethToWsteth(amount);
    }

    function _stethToWsteth(uint256 amount) private returns (uint256) {
        IERC20(steth).safeIncreaseAllowance(wsteth, amount);
        IWSteth(wsteth).wrap(amount);
        return IERC20(wsteth).balanceOf(address(this));
    }

    /// @inheritdoc IDepositWrapper
    function deposit(
        address to,
        address token,
        uint256 amount,
        uint256 minLpAmount,
        uint256 deadline
    ) external payable returns (uint256 lpAmount) {
        address wrapper = address(this);
        address sender = msg.sender;
        address[] memory tokens = vault.underlyingTokens();
        if (tokens.length != 1 || tokens[0] != wsteth)
            revert InvalidTokenList();
        if (amount == 0) revert InvalidAmount();
        if (token == steth) {
            IERC20(steth).safeTransferFrom(sender, wrapper, amount);
            amount = _stethToWsteth(amount);
        } else if (token == weth) {
            IERC20(weth).safeTransferFrom(sender, wrapper, amount);
            amount = _wethToWsteth(amount);
        } else if (token == address(0)) {
            if (msg.value != amount) revert InvalidAmount();
            amount = _ethToWsteth(amount);
        } else if (wsteth == token) {
            IERC20(wsteth).safeTransferFrom(sender, wrapper, amount);
        } else revert InvalidToken();

        IERC20(wsteth).safeIncreaseAllowance(address(vault), amount);
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        (, lpAmount) = vault.deposit(to, amounts, minLpAmount, deadline);
        uint256 balance = IERC20(wsteth).balanceOf(wrapper);
        if (balance > 0) IERC20(wsteth).safeTransfer(sender, balance);
        emit DepositWrapperDeposit(sender, token, amount, lpAmount, deadline);
    }

    receive() external payable {
        if (msg.sender != address(weth)) revert InvalidSender();
    }
}
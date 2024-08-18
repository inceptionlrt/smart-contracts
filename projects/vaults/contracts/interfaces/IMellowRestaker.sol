// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IMellowVault.sol";

interface IMellowRestaker {

    function delegateMellow(
        uint256 amount,
        uint256 minLpAmount,
        uint256 deadline
    ) external returns (uint256 lpAmount);

    function withdrawMellow(uint256 minLpAmount, bool closePrevious) external returns (uint256);

    function claimMellowWithdrawalCallback(uint256 amount) external returns (uint256);

    function pendingMellowRequest() external returns (IMellowVault.WithdrawalRequest memory);

    error BadMellowWithdrawRequest();

    error NotEnoughBalance();

    error ValueZero();

    error MellowLimitOverflow();
}

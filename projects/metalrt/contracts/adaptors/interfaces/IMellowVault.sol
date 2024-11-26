// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMellowVault {
    function registerWithdrawal(address to, uint256 lpAmount, uint256[] memory minAmounts, uint256 deadline, uint256 requestDeadline, bool closePrevious) external;
}
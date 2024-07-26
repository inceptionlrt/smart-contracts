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

    function withdrawMellow(uint256 lpAmount, uint256 minLpAmount, uint256 deadline, uint256 requestDeadline, bool closePrevious) external;

    function claimMellowWithdrawalCallback(uint256 amount) external;

    function pendingMellowRequest() external returns (IMellowVault.WithdrawalRequest memory);
}

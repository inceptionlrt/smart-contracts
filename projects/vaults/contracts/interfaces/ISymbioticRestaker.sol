// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./mellow/IMellowVault.sol";

interface ISymbioticRestaker {
    function getDeposited() external view returns (uint256);

    function delegate(uint256 amount) external returns (uint256 lpAmount);

    // function withdraw(
    //     uint256 minLpAmount,
    //     bool closePrevious
    // ) external returns (uint256);

    // function claimMellowWithdrawalCallback() external returns (uint256);

    // function pendingMellowRequest()
    //     external
    //     returns (IMellowVault.WithdrawalRequest memory);

    //    function pendingWithdrawalAmount() external view returns (uint256);

    // function claimableAmount() external view returns (uint256);
}
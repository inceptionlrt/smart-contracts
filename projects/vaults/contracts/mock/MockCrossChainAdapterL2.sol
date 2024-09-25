// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockCrossChainAdapterL2
/// @notice A mock implementation of a cross-chain adapter for L2 to simulate sending assets or ETH to L1.
contract MockCrossChainAdapterL2 {
    /// @dev Event emitted when asset information is sent to L1
    event AssetsInfoSentToL1(uint256 tokensAmount, uint256 ethAmount);

    /// @dev Event emitted when ETH is sent to L1
    event EthSentToL1(uint256 amount);

    /// @notice Mock function to simulate sending assets info to L1
    /// @param tokensAmount The amount of tokens to send info about
    /// @param ethAmount The amount of ETH to send info about
    /// @return success Returns true if the operation is successful
    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount
    ) external returns (bool success) {
        // Simulate sending assets info to L1 by emitting an event
        emit AssetsInfoSentToL1(tokensAmount, ethAmount);
        return true;
    }

    /// @notice Mock function to simulate sending ETH to L1
    /// @return success Returns true if the operation is successful
    function sendEthToL1() external payable returns (bool success) {
        require(msg.value > 0, "No ETH sent");
        // Simulate sending ETH to L1 by emitting an event
        emit EthSentToL1(msg.value);
        return true;
    }

    /// @notice Mock function to simulate failures when sending ETH to L1
    /// @dev Use this to test failure cases
    function failSendEthToL1() external payable returns (bool success) {
        require(msg.value > 0, "No ETH sent");
        return false; // Simulate a failure
    }
}

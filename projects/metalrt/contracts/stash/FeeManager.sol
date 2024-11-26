// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract FeeManager {
    address public owner;
    uint256 public depositFee; // Fee in basis points (e.g., 50 = 0.5%)
    uint256 public withdrawalFee;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor(uint256 _depositFee, uint256 _withdrawalFee) {
        owner = msg.sender;
        depositFee = _depositFee;
        withdrawalFee = _withdrawalFee;
    }

    function setDepositFee(uint256 _fee) external onlyOwner {
        depositFee = _fee;
    }

    function setWithdrawalFee(uint256 _fee) external onlyOwner {
        withdrawalFee = _fee;
    }

    function calculateFee(uint256 amount, uint256 feeRate) public pure returns (uint256) {
        return (amount * feeRate) / 10000;
    }
}
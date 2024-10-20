// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DummyRebalancer is Ownable {
    event Received(address indexed sender, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // Allow the contract to receive ETH
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    // Function to withdraw all ETH to the contract's owner
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds available");
        (bool success, ) = owner().call{ value: balance }("");
        require(success, "Transfer failed");
        emit Withdrawn(owner(), balance);
    }
}

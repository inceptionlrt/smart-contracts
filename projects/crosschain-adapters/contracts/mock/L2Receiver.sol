// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract L2Receiver {
    event Received(address sender, uint256 amount);

    // Function to handle receiving ETH
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}

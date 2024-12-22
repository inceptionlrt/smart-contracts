// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20 Token with mint and burn capabilities
/// @notice This contract is a simple mock of an ERC-20 token for testing purposes
contract MockBox {
    IERC20 public token;

    constructor(
        IERC20 _token
    ) {
        token = _token;
    }

    function deposit(uint256 amount) external {
        token.transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) external {
        token.transfer(msg.sender, amount);
    }
}

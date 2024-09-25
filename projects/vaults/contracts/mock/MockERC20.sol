// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20 Token with mint and burn capabilities
/// @notice This contract is a simple mock of an ERC-20 token for testing purposes
contract MockERC20 is ERC20 {
    /// @notice Constructor to initialize the token
    /// @param name The name of the token
    /// @param symbol The symbol of the token
    /// @param initialSupply The initial supply of tokens to mint
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply); // Mint initial supply to the deployer
    }

    /// @notice Function to mint tokens to a specified address
    /// @param to The address that will receive the minted tokens
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Function to burn tokens from a specified address
    /// @param from The address from which tokens will be burned
    /// @param amount The amount of tokens to burn
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

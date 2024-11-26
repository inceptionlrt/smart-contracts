// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract OracleRegistry {
    address public owner;
    mapping(address => bool) public whitelistedOracles;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Adds an oracle to the whitelist.
    /// @param oracle The address of the oracle to add.
    function addOracle(address oracle) external onlyOwner {
        whitelistedOracles[oracle] = true;
    }

    /// @notice Removes an oracle from the whitelist.
    /// @param oracle The address of the oracle to remove.
    function removeOracle(address oracle) external onlyOwner {
        whitelistedOracles[oracle] = false;
    }

    /// @notice Checks if an oracle is whitelisted.
    /// @param oracle The address of the oracle.
    /// @return bool True if the oracle is whitelisted.
    function isOracle(address oracle) external view returns (bool) {
        return whitelistedOracles[oracle];
    }
}
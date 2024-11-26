// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract AdapterRegistry {
    address public owner;
    mapping(address => bool) public isAdapterWhitelisted;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addAdapter(address adapter) external onlyOwner {
        isAdapterWhitelisted[adapter] = true;
    }

    function removeAdapter(address adapter) external onlyOwner {
        isAdapterWhitelisted[adapter] = false;
    }

    function isAdapter(address adapter) external view returns (bool) {
        return isAdapterWhitelisted[adapter];
    }
}
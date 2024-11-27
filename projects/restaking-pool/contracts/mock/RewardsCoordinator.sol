// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RewardsCoordinator {

    mapping(address => address) public claimerFor;

    constructor() {}
    
    function setClaimerFor(address claimer) external {
        claimerFor[msg.sender] = claimer;
    }
}

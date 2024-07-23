// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

contract ExpensiveStakerMock {
    uint256 public constant DIFFICULTY = 100;

    constructor() {}

    // cost is 12_507 gas
    receive() external payable {
        uint256 initialGas = gasleft();
        console.log("ExpensiveStakerMock: start gas spending");
        uint i = 0;
        while (i < DIFFICULTY) {
            i++;
        }
        console.log("ExpensiveStakerMock: gas spent");
        console.log(initialGas - gasleft());
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interfaces/IMellowVault.sol";

contract OperatorMock {

    address public mellowVault;

    constructor(address _mellowVault) {
        mellowVault = _mellowVault;
    }

    function processWithdrawals(
        address[] memory users
    ) external returns (bool status) {
        bool[] memory statuses = IMellowVault(mellowVault).processWithdrawals(users);
        return statuses[0];
    }
}

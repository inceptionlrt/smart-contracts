// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IDefaultBondStrategy} from "../../interfaces/mellow/IDefaultBondStrategy.sol";

contract OperatorMock {

    address public mellowVault;

    constructor(address _mellowVault) {
        mellowVault = _mellowVault;
    }

    function processWithdrawals(
        address[] memory users
    ) external {

        IDefaultBondStrategy(mellowVault).processWithdrawals(users);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IDepositManager {
    function delegatedTo(address delegator) external view returns (address);
}

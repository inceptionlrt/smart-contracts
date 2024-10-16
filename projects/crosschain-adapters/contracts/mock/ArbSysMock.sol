// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract ArbSysMock {
    uint256 private _withdrawalId;

    constructor() {
        _withdrawalId = 0;
    }

    function sendTxToL1(address l1Target, bytes memory data) public payable returns (uint256) {
        _withdrawalId++;
        return _withdrawalId;
    }

    function withdrawEth(address l1Target) public payable returns (uint256) {
        _withdrawalId++;
        return _withdrawalId;
    }

    function getWithdrawalId() public view returns (uint256) {
        return _withdrawalId;
    }
}

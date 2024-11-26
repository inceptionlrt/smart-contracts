// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMetaLRTCore {

    // --- Errors ---
    error MetaLRTCoreMaxMargin();
    error MetaLRTCoreInvalidAmount();
    error MetaLRTCoreZeroAddress();

    // --- Events ---
    event Claim(address indexed _owner, address indexed _receiver, uint256 _yield);
    event YieldHeritor(address _oldHeritor, address _newHeritor);
    event YieldMargin(uint256 _oldMargin, uint256 _newMargin);
    event AdapterChanged(address _oldAdapter, address _newAdapter);
}
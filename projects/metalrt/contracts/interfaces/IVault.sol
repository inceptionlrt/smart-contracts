// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract IVault {

    // --- Events ---
    event Delegate(address indexed _adaptor, uint256 indexed _amount);
    event Undelegate(address indexed _adaptor, uint256 indexed _amount);
    event ClaimYield(address indexed _adaptor);
    event AdaptorControllerSet(address indexed _oldAdaptorController, address indexed _newAdaptorController);
    event DelegatorSet(address indexed _oldDelegator, address indexed _newDelegator);

    // --- Errors ---
    error Vault_NotDelegator();
    error Vault_InvalidAmount();
    error Vault_InvalidAddress();
}
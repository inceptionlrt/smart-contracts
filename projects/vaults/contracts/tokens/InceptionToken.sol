// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IInceptionToken} from "../interfaces/common/IInceptionToken.sol";
import {IInceptionVault_EL} from "../interfaces/eigenlayer-vault/IInceptionVault_EL.sol";

/// @author The InceptionLRT team
/// @title The InceptionToken contract
/// @dev Specifically, this includes pausable functions and minting from the vault
contract InceptionToken is
OwnableUpgradeable,
ERC20Upgradeable,
IInceptionToken
{
    IInceptionVault_EL public vault;

    bool private _paused;

    modifier onlyVault() {
        require(
            msg.sender == address(vault),
            "InceptionToken: only vault allowed"
        );
        _;
    }

    modifier whenNotPaused() {
        require(!paused(), "InceptionToken: paused");
        _;
    }

    modifier whenPaused() {
        require(paused(), "InceptionToken: not paused");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string calldata name,
        string calldata symbol
    ) public initializer {
        __Ownable_init();
        __ERC20_init_unchained(name, symbol);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "InceptionToken: token transfer while paused");
    }

    function burn(address account, uint256 amount) external override onlyVault {
        _burn(account, amount);
    }

    function mint(address account, uint256 amount) external override onlyVault {
        _mint(account, amount);
    }

    /*//////////////////////
    //// Set functions ////
    ////////////////////*/

    function setVault(IInceptionVault_EL newValue) external onlyOwner {
        emit VaultChanged(address(vault), address(newValue));
        vault = newValue;
    }

    /*///////////////////////////
    //// Pausable functions ////
    //////////////////////////*/

    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Triggers stopped state
     * @notice The contract must not be paused
     */
    function pause() external whenNotPaused onlyOwner {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state
     * @notice The contract must be paused
     */
    function unpause() external whenPaused onlyOwner {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}
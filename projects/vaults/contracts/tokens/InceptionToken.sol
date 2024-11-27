// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/IInceptionToken.sol";
import "../interfaces/IInceptionVault.sol";

import "../lib/Convert.sol";

/// @author The InceptionLRT team
/// @title The InceptionToken contract
/// @dev Specifically, this includes pausable functions and minting from the vault
contract InceptionToken is
    OwnableUpgradeable,
    ERC20Upgradeable,
    IInceptionToken
{
    IInceptionVault public vault;

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

    modifier whenNotPausedTransfers() {
        require(!paused(), "InceptionToken: token transfer while paused");
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
        __Ownable_init(msg.sender);
        __ERC20_init_unchained(name, symbol);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPausedTransfers {
        super._update(from, to, value);
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

    function setVault(IInceptionVault newValue) external onlyOwner {
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

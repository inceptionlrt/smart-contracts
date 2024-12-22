// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IInceptionToken, IInceptionErrors} from "../interfaces/IInceptionToken.sol";
import {IInceptionVault} from "../interfaces/IInceptionVault.sol";

/**
 * @title The InceptionToken contract
 * @author The InceptionLRT team
 * @dev Specifically, this includes pausable functions and minting from the vault
 */
contract InceptionToken is
    OwnableUpgradeable,
    ERC20Upgradeable,
    IInceptionToken,
    IInceptionErrors
{
    IInceptionVault public vault;

    bool private _paused;

    address public rebalancer;

    modifier onlyMinter() {
        require(
            msg.sender == address(vault) ||  msg.sender == rebalancer,
            OnlyMinterAllowed()
        );
        _;
    }

    modifier whenNotPaused() {
        require(!paused(), IsPaused());
        _;
    }

    modifier whenPaused() {
        require(paused(), NotPaused());
        _;
    }

    modifier whenNotPausedTransfers() {
        require(!paused(), TransferIsPaused());
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable{
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

    function burn(address account, uint256 amount) external override onlyMinter {
        _burn(account, amount);
    }

    function mint(address account, uint256 amount) external override onlyMinter {
        _mint(account, amount);
    }

    /*//////////////////////
    //// Set functions ////
    ////////////////////*/

    function setVault(IInceptionVault newValue) external onlyOwner {
        emit VaultChanged(address(vault), address(newValue));
        vault = newValue;
    }


    function setRebalancer(address newRebalancer) external onlyOwner {
        emit RebalancerChanged(rebalancer, newRebalancer);
        rebalancer = newRebalancer;
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IVault} from "../interfaces/symbiotic-vault/symbiotic-core/IVault.sol";
import {IAdapterClaimer} from "../interfaces/adapter-claimer/IAdapterClaimer.sol";

/**
 * @title SymbioticAdapterClaimer
 * @author The InceptionLRT team
 * @notice Adapter claimer for Symbiotic Vaults
 * @notice In order to claim withdrawals multiple times
 * @dev This contract is used to claim rewards from Symbiotic Vaults
 */
contract SymbioticAdapterClaimer is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    OwnableUpgradeable,
    IAdapterClaimer
{
    address internal _adapter;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(address asset) external initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        __ERC165_init();

        _adapter = msg.sender;
        require(
            IERC20(asset).approve(_adapter, type(uint256).max),
            ApprovalFailed()
        );
    }


     /**
     * @notice Claims rewards from a Symbiotic Vault
     * @notice executable only by the adapter
     * @param vault The address of the Symbiotic Vault
     * @param recipient The address to receive the rewards
     * @param epoch The epoch to claim withdrawals for
     * @return The amount of rewards claimed
     */
    function claim(
        address vault,
        address recipient,
        uint256 epoch
    ) external returns (uint256) {
        require(msg.sender == _adapter, OnlyAdapter());
        return IVault(vault).claim(recipient, epoch);
    }
}
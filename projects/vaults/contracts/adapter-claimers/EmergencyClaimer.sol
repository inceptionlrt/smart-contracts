// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";
import {IVault} from "../interfaces/symbiotic-vault/symbiotic-core/IVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title The ISymbioticAdapter Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the SymbioticFi Protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract EmergencyClaimer is Initializable, Ownable2StepUpgradeable {
    address public symbioticAdapter;
    address public mellowAdapter;

    event AdapterChanged(address adapter);

    /**
     * @notice Initializes the EmergencyClaimer contract.
     * @dev Sets up the contract with two-step ownership using OpenZeppelin's Ownable2StepUpgradeable.
     */
    function initialize() external initializer {
        __Ownable2Step_init();
    }

    /**
     * @notice Restricts function access to only the mellow adapter.
     * @dev Reverts if the caller is not the designated mellow adapter.
     */
    modifier onlyMellowAdapter() {
        require(msg.sender == mellowAdapter, "Only mellow adapter allowed");
        _;
    }

    /**
     * @notice Restricts function access to only the symbiotic adapter.
     * @dev Reverts if the caller is not the designated symbiotic adapter.
     */
    modifier onlySymbioticAdapter() {
        require(msg.sender == symbioticAdapter, "Only symbiotic adapter allowed");
        _;
    }

    /**
     * @notice Claims funds from a Symbiotic vault for a specific epoch.
     * @dev Can only be called by the symbiotic adapter.
     * @param vault The address of the Symbiotic vault to claim from.
     * @param recipient The address to receive the claimed funds.
     * @param epoch The epoch for which the claim is being made.
     * @return The amount of funds claimed.
     */
    function claimSymbiotic(address vault, address recipient, uint256 epoch) external onlySymbioticAdapter returns (uint256) {
        return IVault(vault).claim(recipient, epoch);
    }

    /**
     * @notice Claims funds from a Mellow Symbiotic vault.
     * @dev Can only be called by the mellow adapter.
     * @param vault The address of the Mellow Symbiotic vault to claim from.
     * @param recipient The address to receive the claimed funds.
     * @param amount The amount of funds to claim.
     * @return The amount of funds claimed.
     */
    function claimMellow(address vault, address recipient, uint256 amount) external onlyMellowAdapter returns (uint256) {
        return IMellowSymbioticVault(vault).claim(
            address(this), recipient, amount
        );
    }

    // MANAGER FUNCTIONS

    /**
     * @notice Sets the address of the symbiotic adapter.
     * @dev Can only be called by the contract owner.
     * @param adapter The new address of the symbiotic adapter.
     */
    function setSymbioticAdapter(address adapter) external onlyOwner {
        symbioticAdapter = adapter;
        emit AdapterChanged(adapter);
    }

    /**
     * @notice Sets the address of the mellow adapter.
     * @dev Can only be called by the contract owner.
     * @param adapter The new address of the mellow adapter.
     */
    function setMellowAdapter(address adapter) external onlyOwner {
        mellowAdapter = adapter;
        emit AdapterChanged(adapter);
    }

    /**
     * @notice Approves a spender to use the maximum amount of a specified ERC20 asset.
     * @dev Can only be called by the contract owner.
     * @param asset The address of the ERC20 token to approve.
     * @param spender The address allowed to spend the asset.
     */
    function approveSpender(address asset, address spender) external onlyOwner {
        IERC20(asset).approve(spender, type(uint256).max);
    }
}
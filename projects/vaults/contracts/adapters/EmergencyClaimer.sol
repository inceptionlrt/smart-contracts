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
    address public eigenAdapter;

    event AdapterChanged(address adapter);

    function initialize() external initializer {
        __Ownable2Step_init();
    }

    modifier onlyMellowAdapter() {
        require(msg.sender == mellowAdapter, "Only mellow adapter allowed");
        _;
    }

    modifier onlySymbioticAdapter() {
        require(msg.sender == symbioticAdapter, "Only symbiotic adapter allowed");
        _;
    }

    modifier onlyEigenAdapter() {
        require(msg.sender == eigenAdapter, "Only eigen adapter allowed");
        _;
    }

    function claimSymbiotic(address vault, address recipient, uint256 epoch) external onlySymbioticAdapter returns (uint256) {
        return IVault(vault).claim(recipient, epoch);
    }

    function claimMellow(address vault, address recipient, uint256 amount) external onlyMellowAdapter returns (uint256) {
        return IMellowSymbioticVault(vault).claim(
            address(this), recipient, amount
        );
    }

    // MANAGER FUNCTIONS

    function setSymbioticAdapter(address adapter) external onlyOwner {
        symbioticAdapter = adapter;
        emit AdapterChanged(adapter);
    }

    function setMellowAdapter(address adapter) external onlyOwner {
        mellowAdapter = adapter;
        emit AdapterChanged(adapter);
    }

    function setEigenAdapter(address adapter) external onlyOwner {
        eigenAdapter = adapter;
        emit AdapterChanged(adapter);
    }

    function approveSpender(address asset, address spender) external onlyOwner {
        IERC20(asset).approve(spender, type(uint256).max);
    }
}
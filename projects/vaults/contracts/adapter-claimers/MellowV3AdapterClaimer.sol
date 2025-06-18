// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IAdapterClaimer} from "../interfaces/adapter-claimer/IAdapterClaimer.sol";
import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";
import {IClaimer} from "../interfaces/symbiotic-vault/mellow-core/IClaimer.sol";

/**
 * @title MellowV3AdapterClaimer
 * @author The InceptionLRT team
 * @notice Adapter claimer for Mellow Vaults
 * @notice In order to claim withdrawals multiple times
 * @dev This contract is used to claim rewards from Mellow Vaults
 */
contract MellowV3AdapterClaimer is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    OwnableUpgradeable,
    IAdapterClaimer
{
    using SafeERC20 for IERC20;
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

    function claim(
        address mellowClaimer,
        address multiVault,
        uint256[] calldata subvaultIndices,
        uint256[][] calldata indices,
        address recipient,
        uint256 maxAssets
    ) external returns (uint256) {
        require(msg.sender == _adapter, OnlyAdapter());
        return IClaimer(mellowClaimer).multiAcceptAndClaim(
            multiVault, subvaultIndices, indices, recipient, maxAssets
        );
    }
}
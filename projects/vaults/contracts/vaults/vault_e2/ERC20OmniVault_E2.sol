// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {InceptionERC20OmniVault, IInceptionToken} from "../InceptionERC20OmniVault.sol";
import {IERC20CrossChainBridge} from "../../interfaces/IERC20CrossChainBridge.sol";

/// @author The InceptionLRT team
/// @title The ERC20OmniVault_E2, specifically designed for the LST Omni Restaking
contract ERC20OmniVault_E2 is InceptionERC20OmniVault {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable{
        _disableInitializers();
    }

    function initialize(
        string memory vaultName,
        address _operator,
        address _inceptionToken,
        address _underlyingAsset,
        IERC20CrossChainBridge _crossChainAdapter
    ) external initializer {
        __InceptionERC20OmniVault_init(vaultName, _operator, IInceptionToken(_inceptionToken), IERC20(_underlyingAsset), _crossChainAdapter);
    }
}

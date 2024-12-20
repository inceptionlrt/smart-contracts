// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../InceptionERC20OmniVault.sol";
import "../../interfaces/IStEth.sol";
import "../../interfaces/IERC20CrossChainBridge.sol";
import {IMultiERC20LZAdapterL2} from "../../interfaces/IMultiERC20LZAdapterL2.sol";
/// @author The InceptionLRT team
/// @title The InOmniVault_E2, specifically designed for the Lido Ethereum LST
contract InOmniVault_E2 is InceptionERC20OmniVault {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory vaultName,
        address _operator,
        address _inceptionToken,
        address _underlyingAsset,
        IMultiERC20LZAdapterL2 _crossChainAdapter

    ) external initializer {
        __InceptionERC20OmniVault_init(vaultName, _operator, IInceptionToken(_inceptionToken), IERC20(_underlyingAsset), _crossChainAdapter);
    }
}

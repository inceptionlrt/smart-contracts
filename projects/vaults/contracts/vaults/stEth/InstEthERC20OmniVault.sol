// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../InceptionERC20OmniVault.sol";
import "../../interfaces/IStEth.sol";
import "../../interfaces/ICrossChainAdapterL2.sol";

/// @author The InceptionLRT team
/// @title The InstEthOmniVault, specifically designed for the Lido Ethereum LST
contract InstEthERC20OmniVault is InceptionERC20OmniVault {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IInceptionToken _inceptionToken,
        IERC20 baseAsset,
        ICrossChainAdapterL2 crossChainAdapter
    ) external initializer {
        __InceptionERC20OmniVault_init(
            "InstEthERC20OmniVault",
            _inceptionToken,
            baseAsset,
            crossChainAdapter
        );
    }
}

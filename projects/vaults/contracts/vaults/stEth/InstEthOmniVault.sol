// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../InceptionOmniVault.sol";
import "../../interfaces/IStEth.sol";
import "../../interfaces/ICrossChainAdapterL2.sol";

/// @author The InceptionLRT team
/// @title The InstEthOmniVault, specifically designed for the Lido Ethereum LST
contract InstEthOmniVault is InceptionOmniVault {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _inceptionToken,
        address _operator,
        ICrossChainAdapterL2 _crossChainAdapter
    ) external initializer {
        __InceptionOmniVault_init(
            "InstEthOmniVault",
            _operator,
            _inceptionToken,
            _crossChainAdapter
        );
    }
}

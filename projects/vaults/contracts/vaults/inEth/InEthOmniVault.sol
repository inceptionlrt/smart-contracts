// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../InceptionOmniVault.sol";
import "../../interfaces/IStEth.sol";

/// @author The InceptionLRT team
/// @title The InEthOmniVault, specifically designed for the Genesis LST
contract InEthOmniVault is InceptionOmniVault {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IInceptionToken _inceptionToken,
        ICrossChainAdapter _crossChainAdapter
    ) external initializer {
        __InceptionOmniVault_init(
            "InEthOmniVault",
            _inceptionToken,
            _crossChainAdapter
        );
    }
}

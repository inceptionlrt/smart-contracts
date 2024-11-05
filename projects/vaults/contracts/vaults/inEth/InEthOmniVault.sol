// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../InceptionOmniVault.sol";
import "../../interfaces/IStEth.sol";
import "../../interfaces/ICrossChainAdapterL2.sol";

/// @author The InceptionLRT team
/// @title The InEthOmniVault, specifically designed for the Genesis LST
contract InEthOmniVault is InceptionOmniVault {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        address _inceptionToken,
        address _operator,
        ICrossChainBridgeL2 _crossChainAdapter
    ) external initializer {
        __InceptionOmniVault_init(
            "InEthOmniVault",
            _operator,
            _inceptionToken,
            _crossChainAdapter
        );
    }
}

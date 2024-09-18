// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {InceptionVault_S, IInceptionToken} from "../InceptionVault_S.sol";
import {IMellowRestaker} from "../../interfaces/IMellowRestaker.sol";

/// @author The InceptionLRT team
contract InVault_E1 is InceptionVault_S {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        string memory vaultName,
        address operatorAddress,
        IInceptionToken _inceptionToken,
        IMellowRestaker _mellowRestaker
    ) external initializer {
        __InceptionVault_init(
            vaultName,
            operatorAddress,
            _inceptionToken,
            _mellowRestaker
        );
    }

    function _getAssetWithdrawAmount(
        uint256 amount
    ) internal pure override returns (uint256) {
        return amount + 1;
    }

    function _getAssetReceivedAmount(
        uint256 amount
    ) internal pure override returns (uint256) {
        return amount - 1;
    }
}

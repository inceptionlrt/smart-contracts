// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {InceptionVault, IStrategyManager, IInceptionToken, IStrategy} from "../InceptionVault.sol";
import "../../interfaces/IMellowRestaker.sol";

/// @author The InceptionLRT team
contract InVault_E2 is InceptionVault {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory vaultName,
        address operatorAddress,
        IStrategyManager _strategyManager,
        IInceptionToken _inceptionToken,
        IStrategy _assetStrategy,
        IMellowRestaker _mellowRestaker
    ) external initializer {
        __InceptionVault_init(
            vaultName,
            operatorAddress,
            _strategyManager,
            _inceptionToken,
            _assetStrategy,
            _mellowRestaker
        );
    }

    function _getAssetWithdrawAmount(
        uint256 amount
    ) internal pure override returns (uint256) {
        return amount + 2;
    }

    function _getAssetReceivedAmount(
        uint256 amount
    ) internal pure override returns (uint256) {
        return amount - 2;
    }
}
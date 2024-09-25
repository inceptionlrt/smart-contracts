// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IStrategyManager, IStrategy} from "../../../interfaces/eigenlayer-vault/eigen-core/IStrategyManager.sol";

import {InceptionVault_EL, IInceptionToken} from "../InceptionVault_EL.sol";

/// @author The InceptionLRT team
contract InVault_E2 is InceptionVault_EL {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory vaultName,
        address operatorAddress,
        IStrategyManager _strategyManager,
        IInceptionToken _inceptionToken,
        IStrategy _assetStrategy
    ) external initializer {
        __InceptionVault_init(
            vaultName,
            operatorAddress,
            _strategyManager,
            _inceptionToken,
            _assetStrategy
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

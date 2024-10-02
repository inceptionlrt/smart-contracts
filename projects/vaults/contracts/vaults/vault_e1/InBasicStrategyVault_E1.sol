// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {InceptionBasicStrategyVault, IStrategyManager, IInceptionToken, IStrategy, IERC20} from "../InceptionBasicStrategyVault.sol";

/// @author The InceptionLRT team
contract InBasicStrategyVault_E1 is InceptionBasicStrategyVault {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        string memory vaultName,
        address operatorAddress,
        IStrategyManager _strategyManager,
        IInceptionToken _inceptionToken,
        IStrategy _assetStrategy,
        IERC20 asset
    ) external initializer {
        __InceptionVault_init(
            vaultName,
            operatorAddress,
            _strategyManager,
            _inceptionToken,
            _assetStrategy,
            asset
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

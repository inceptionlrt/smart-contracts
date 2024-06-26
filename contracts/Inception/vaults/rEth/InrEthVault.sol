// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../InceptionVault.sol";
import "../../../interfaces/IrEth.sol";

/// @author The InceptionLRT team
/// @title The InrEthVault, specifically designed for the Rocket Ethereum LST
contract InrEthVault is InceptionVault {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address operatorAddress,
        IStrategyManager _strategyManager,
        IInceptionToken _inceptionToken,
        IStrategy _assetStrategy
    ) external initializer {
        __InceptionVault_init(
            "InrEthVault",
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

    function _getAssetRedeemAmount(
        uint256 amount
    ) internal pure override returns (uint256) {
        return amount + 1;
    }
}

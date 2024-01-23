// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../InceptionVault.sol";
import "../../../interfaces/IrEth.sol";

/// @author The InceptionLRT team
/// @title The InwbEthVault, specifically designed for the Wrapped Binance Ethereum LST
contract InwbEthVault is InceptionVault {
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
            operatorAddress,
            _strategyManager,
            _inceptionToken,
            _assetStrategy
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

    function _getAssetRedeemAmount(
        uint256 amount
    ) internal pure override returns (uint256) {
        return amount + 1;
    }
}

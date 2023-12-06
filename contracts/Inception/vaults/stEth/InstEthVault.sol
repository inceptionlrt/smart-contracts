// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../InceptionVault.sol";
import "../../../interfaces/IStEth.sol";

contract InstEthVault is InceptionVault {
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
        return amount + 2;
    }
}

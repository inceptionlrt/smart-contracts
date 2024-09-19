// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {InceptionVault_S, IInceptionToken, IERC20} from "../InceptionVault_S.sol";
import {IMellowRestaker} from "../../interfaces/IMellowRestaker.sol";

/// @author The InceptionLRT team
contract InVault_E2 is InceptionVault_S {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        string memory vaultName,
        address operatorAddress,
        IERC20 assetAddress,
        IInceptionToken _inceptionToken,
        IMellowRestaker _mellowRestaker
    ) external initializer {
        __InceptionVault_init(
            vaultName,
            operatorAddress,
            assetAddress,
            _inceptionToken,
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

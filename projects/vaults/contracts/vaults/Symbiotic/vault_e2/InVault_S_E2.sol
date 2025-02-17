// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {InceptionVault_S, IInceptionToken, IERC20} from "../InceptionVault_S.sol";
import {IIMellowRestaker} from "../../../interfaces/symbiotic-vault/restakers/IIMellowRestaker.sol";
import {IISymbioticRestaker} from "../../../interfaces/symbiotic-vault/restakers/IISymbioticRestaker.sol";

/// @author The InceptionLRT team
contract InVault_S_E2 is InceptionVault_S {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        string memory vaultName,
        address operatorAddress,
        IERC20 assetAddress,
        IInceptionToken _inceptionToken,
        IIMellowRestaker _mellowRestaker,
        IISymbioticRestaker _symbioticRestaker
    ) external initializer {
        __InceptionVault_init(
            vaultName,
            operatorAddress,
            assetAddress,
            _inceptionToken,
            _mellowRestaker,
            _symbioticRestaker
        );
    }

    function _getAssetWithdrawAmount(uint256 amount)
        internal
        pure
        override
        returns (uint256)
    {
        return amount + 2;
    }

    function _getAssetReceivedAmount(uint256 amount)
        internal
        pure
        override
        returns (uint256)
    {
        return amount - 2;
    }
}

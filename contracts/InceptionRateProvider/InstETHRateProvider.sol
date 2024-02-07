// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "./InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InstETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for instETH LRT.
contract InstETHRateProvider is InceptionRateProvider {
    // --- Init ---
    constructor(address vaultAddress) InceptionRateProvider(vaultAddress) {}

    function instETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InswETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for inswETH LRT.
contract InswETHRateProvider is InceptionRateProvider {
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function inswETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

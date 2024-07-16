// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The IncbETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for incbETH LRT.
contract IncbETHRateProvider is InceptionRateProvider {
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function incbETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

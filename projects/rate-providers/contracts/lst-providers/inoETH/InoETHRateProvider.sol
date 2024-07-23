// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InoETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for inoETH LRT.
contract InoETHRateProvider is InceptionRateProvider {
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function inoETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

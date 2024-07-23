// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InosETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for inosETH LRT.
contract InosETHRateProvider is InceptionRateProvider {
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function inosETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

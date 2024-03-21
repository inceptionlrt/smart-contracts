// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InankrETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for inankrETH LRT.
contract InankrETHRateProvider is InceptionRateProvider {
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function inankrETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

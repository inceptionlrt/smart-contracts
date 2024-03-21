// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InETHxRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for inETHx LRT.
contract InETHxRateProvider is InceptionRateProvider {
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function inETHx() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

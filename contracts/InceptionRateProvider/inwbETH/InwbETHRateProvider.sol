// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InwbETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for inwbETH LRT.
contract InwbETHRateProvider is InceptionRateProvider {
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function inwbETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

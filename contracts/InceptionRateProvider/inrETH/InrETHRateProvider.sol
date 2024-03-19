// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InrETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for inrETH LRT.
contract InrETHRateProvider is InceptionRateProvider {
    // --- Init ---
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function inrETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

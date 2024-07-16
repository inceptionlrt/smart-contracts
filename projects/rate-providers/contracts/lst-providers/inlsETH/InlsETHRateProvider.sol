// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InlsETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for inlsETH LRT.
contract InlsETHRateProvider is InceptionRateProvider {
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function inlsETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

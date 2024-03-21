// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InmETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for inmETH LRT.
contract InmETHRateProvider is InceptionRateProvider {
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function inmETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

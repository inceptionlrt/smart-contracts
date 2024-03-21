// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../InceptionRateProvider.sol";

/// @author The InceptionLRT team
/// @title The InsfrxETHRateProvider contract
/// @notice The InceptionRateProvider is used to build a rate provider for insfrxETH LRT.
contract InsfrxETHRateProvider is InceptionRateProvider {
    constructor(
        address vaultAddress
    ) payable InceptionRateProvider(vaultAddress) {}

    function insfrxETH() external view returns (address) {
        return address(inceptionVault.inceptionToken());
    }
}

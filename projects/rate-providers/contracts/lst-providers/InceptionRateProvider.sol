// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/math/Math.sol";

import "../interfaces/IRateProvider.sol";
import "../interfaces/IInceptionVault.sol";

/**
 * @author The InceptionLRT V2 team
 * @title The InceptionRateProvider contract
 * @notice Inheritable standard rate provider interface.
 */
abstract contract InceptionRateProvider is IRateProvider {
    using Math for uint256;

    IInceptionVault public inceptionVault;

    constructor(address vaultAddress) payable {
        inceptionVault = IInceptionVault(vaultAddress);
    }

    function getRate() external view override returns (uint256) {
        return
            Math.mulDiv(
                1 ether,
                1 ether,
                inceptionVault.ratio(),
                Math.Rounding.Floor
            );
    }
}

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "../interfaces/IRateProvider.sol";

import "../interfaces/IInceptionVault.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

/// @author The InceptionLRT team
/// @title The InceptionRateProvider contract
/// @notice Inheritable standard rate provider interface.
abstract contract InceptionRateProvider is IRateProvider {
    using SafeMathUpgradeable for uint256;

    IInceptionVault public inceptionVault;

    constructor(address vaultAddress) {
        inceptionVault = IInceptionVault(vaultAddress);
    }

    function getRate() external view override returns (uint256) {
        return safeFloorMultiplyAndDivide(1e18, 1e18, inceptionVault.ratio());
    }

    function safeFloorMultiplyAndDivide(
        uint256 a,
        uint256 b,
        uint256 c
    ) internal pure returns (uint256) {
        uint256 remainder = a.mod(c);
        uint256 result = a.div(c);
        bool safe;
        (safe, result) = result.tryMul(b);
        if (!safe) {
            return
                0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        }
        (safe, result) = result.tryAdd(remainder.mul(b).div(c));
        if (!safe) {
            return
                0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        }
        return result;
    }
}

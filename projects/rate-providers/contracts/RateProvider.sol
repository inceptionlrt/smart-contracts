// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/math/Math.sol";

interface ICToken {
    function ratio() external view returns (uint256);
}

interface IRateProvider {
    function getRate() external view returns (uint256);
}

/**
 * @title RateProvider
 * @author GenesisLRT
 * @notice Redemption rate provider for balancer.
 */
contract InEthRateProvider is IRateProvider {
    ICToken public token;

    constructor(ICToken token_) {
        token = token_;
    }

    function getRate() external view override returns (uint256) {
        /// repeats cToken.convertToAmount method
        return Math.mulDiv(1 ether, 1 ether, token.ratio(), Math.Rounding.Ceil);
    }
}

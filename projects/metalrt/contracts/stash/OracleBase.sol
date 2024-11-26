// corresponding adapter with points/yield data

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract OracleBase {
    function getProportionData() external view returns (uint256, uint256) {
        // Mock data: returns proportions for instETH and instETH.s
        return (30, 70);
    }
}
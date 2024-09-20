// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICrossChainAdapter
 * @dev Paul Fomichov
 */
interface ICrossChainAdapter {
    error VaultNotSet();
    error OnlyVault();

    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount
    ) external returns (bool success);

    function sendEthToL1() external payable returns (bool success);
}

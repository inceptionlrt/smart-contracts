// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.28;

interface IClaimer {
    function multiAcceptAndClaim(
        address multiVault,
        uint256[] calldata subvaultIndices,
        uint256[][] calldata indices,
        address recipient,
        uint256 maxAssets
    ) external returns (uint256 assets);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IInceptionAssetHandler {
    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    function isAssetSupported(
        address assetAddress
    ) external view returns (bool);

    function getAssets() external view returns (address[] memory);

    function getAssetETHValue(
        address assetAddress,
        uint256 amount
    ) external view returns (uint256);

    function getAssetValue(
        address assetAddress,
        uint256 ethAmount
    ) external view returns (uint256);

    function getAssetReceivedAmount(
        address assetAddress,
        uint256 amount
    ) external view returns (uint256);

    function getVaultBalanceInAssets()
        external
        view
        returns (address[] memory assets, uint256[] memory balances);

    function getVaultBalanceInETH() external view returns (uint256);

    function convertAssets(
        address fromAsset,
        address toAsset,
        uint256 amount
    ) external view returns (uint256);
}

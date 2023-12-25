// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IInceptionAssetHandler {
    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    /// @dev returns total balance of Vault in the asset
    function totalAssets() external view returns (uint256);
}

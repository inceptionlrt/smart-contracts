// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPriceController {

    // --- Events ---
    event TokenSet(address indexed _token, uint8 indexed _approach);
    event RatioProviderSet(address indexed _token, address indexed _provider);

    // --- Errors ---
    error PriceController_InvalidAddress();
    error PriceController_UnknownApproach();

    // --- Functions ---
    function convertToShares(address _token, uint256 _amount) external view returns (uint256);
    function convertToAssets(address _token, uint256 _amount) external view returns (uint256);
}
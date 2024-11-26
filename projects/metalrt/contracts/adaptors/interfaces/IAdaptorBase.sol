// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// --- IAdaptorBase ---
interface IAdaptorBase {

    // --- Events ---
    event Provided(uint256 indexed _assets, uint256 indexed _shares);
    event Released(uint256 indexed _assets, uint256 indexed _actualAssets, address indexed _receiver);
    event Claim(address indexed _caller, address indexed _receiver, uint256 indexed _yield);

    // --- Errors ---
    error Adaptor_OnlyAdapterController();
    error Adaptor_MaxMargin();

    // --- Functions ---
    function asset() external view returns (address);
    function share() external view returns (address);
    function target() external view returns (address);
    
    function provide(uint256 _assets) external returns (uint256 _shares);
    function release(uint256 _assets, address _receiver) external returns (uint256 _actualAssets);
    function claim() external returns (uint256);
    
    function totalAssets() external view returns (uint256);
    function previewYield() external view returns (uint256);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInceptionToken {
    function mint(address account, uint256 shares) external;
    function burn(address account, uint256 shares) external;
    function convertToAmount(uint256 shares) external pure returns (uint256);
    function convertToShares(uint256 amount) external pure returns (uint256);
    function changeName(string memory newName) external;
    function changeSymbol(string memory newSymbol) external;
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function balanceOf(address account) external view returns (uint256);
}

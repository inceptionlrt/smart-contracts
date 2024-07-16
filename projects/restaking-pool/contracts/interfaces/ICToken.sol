// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Interface of the cToken.
 */
interface ICToken is IERC20 {
    /* errors */

    /* functions */

    function convertToShares(
        uint256 amount
    ) external view returns (uint256 shares);

    function convertToAmount(
        uint256 shares
    ) external view returns (uint256 amount);

    function mint(address account, uint256 amount) external;

    function burn(address account, uint256 amount) external;

    function ratio() external view returns (uint256);

    function totalAssets() external view returns (uint256 totalManagedEth);
}

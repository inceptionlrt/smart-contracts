// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IInceptionToken {
    event VaultChanged(address prevValue, address newValue);

    event Paused(address account);
    event Unpaused(address account);

    function mint(address account, uint256 amount) external;

    function burn(address account, uint256 amount) external;
}

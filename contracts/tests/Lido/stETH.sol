// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract stETH is ERC20Upgradeable {
    function initialize(
        string calldata _name,
        string calldata _symbol
    ) public initializer {
        __ERC20_init_unchained(_name, _symbol);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function sharesOf(address _account) public view returns (uint256) {}

    function getPooledEthByShares(
        uint256 _sharesAmount
    ) public view returns (uint256) {}

    function getSharesByPooledEth(
        uint256 _ethAmount
    ) public view returns (uint256) {}
}

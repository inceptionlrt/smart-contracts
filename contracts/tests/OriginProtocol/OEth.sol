// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract OEth is ERC20Upgradeable {
    // function balanceOf(address _account)
    //     public
    //     view
    //     override
    //     returns (uint256)
    // {
    //     if (_creditBalances[_account] == 0) return 0;
    //     return
    //         _creditBalances[_account].divPrecisely(_creditsPerToken(_account));
    // }

    function creditsBalanceOfHighres(
        address _account
    ) public view returns (uint256, uint256, bool) {}

    function creditsBalanceOf(
        address _account
    ) public view returns (uint256, uint256) {}
}

//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IERC20Mintable.sol";

contract DummyToken is IERC20Mintable, ERC20Permit, ERC20Burnable, Ownable {
    constructor()
      Ownable()
      ERC20("SecondUnderlyingToken", "UT2")
      ERC20Permit("SecondUnderlyingToken") {
    }

    function mint(address to, uint256 amount) external { // no access control on minting for test reasons
      _mint(to, amount);
    }

    function burnFrom(address account, uint256 value) public override {
        //_spendAllowance(account, _msgSender(), value);
        _burn(account, value);
    }
}
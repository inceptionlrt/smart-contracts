// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../../interfaces/IInceptionToken.sol";
import "../../interfaces/IInceptionVault.sol";

import "../lib/Convert.sol";

contract InceptionToken is
    OwnableUpgradeable,
    ERC20Upgradeable,
    IInceptionToken
{
    IInceptionVault public vault;

    modifier onlyVault() {
        require(
            msg.sender == address(vault),
            "InceptionToken: only vault allowed"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string calldata name,
        string calldata symbol
    ) public initializer {
        __Ownable_init();
        __ERC20_init_unchained(name, symbol);
    }

    function burn(address account, uint256 amount) external override onlyVault {
        _burn(account, amount);
    }

    function mint(address account, uint256 amount) external override onlyVault {
        _mint(account, amount);
    }

    // function convertEthToShares(
    //     uint256 ethAmount
    // ) public view returns (uint256) {
    //     return Convert.multiplyAndDivideFloor(ethAmount, vault.ratio(), 1e18);
    // }

    // function convertSharesToEth(uint256 iAmount) public view returns (uint256) {
    //     return Convert.multiplyAndDivideCeil(iAmount, 1e18, vault.ratio());
    // }

    // convert methods

    function setVault(IInceptionVault newValue) external onlyOwner {
        emit VaultChanged(address(vault), address(newValue));
        vault = newValue;
    }
}

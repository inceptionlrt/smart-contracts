// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract WBEth is ERC20Upgradeable {
    function deposit(address referral) external payable {
        // require(msg.value > 0, "zero ETH amount");
        // // msg.value and exchangeRate are all scaled by 1e18
        // uint256 wBETHAmount = msg.value.mul(_EXCHANGE_RATE_UNIT).div(exchangeRate());
        // _mint(msg.sender, wBETHAmount);
        // emit DepositEth(msg.sender, msg.value, wBETHAmount, referral);
    }

    // function requestWithdrawEth(uint256 wbethAmount) external {
    //     require(wbethAmount > 0, "zero wBETH amount");

    //     // msg.value and exchangeRate are all scaled by 1e18
    //     uint256 ethAmount = wbethAmount.mul(exchangeRate()).div(
    //         _EXCHANGE_RATE_UNIT // 1e18
    //     );
    //     _burn(wbethAmount);
    //     IUnwrapTokenV1(_UNWRAP_ETH_ADDRESS).requestWithdraw(
    //         msg.sender,
    //         wbethAmount,
    //         ethAmount
    //     );
    //     emit RequestWithdrawEth(msg.sender, wbethAmount, ethAmount);
    // }

    function exchangeRate() public view returns (uint256) {}
}

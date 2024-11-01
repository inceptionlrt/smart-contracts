// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20     } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20  } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC4626   } from "@openzeppelin/contracts/interfaces/IERC4626.sol";

interface IRToken {
    function wrap(uint256 _amount) external returns (uint256);
    function unwrap(uint256 _shares) external returns (uint256);
    function getStETHByWstETH(uint256 _wstETHAmount) external returns (uint256);
    function getWstETHByStETH(uint256 _stETHAmount) external view returns (uint256);
}

contract StETHProvider {

    using SafeERC20 for IERC20;

    address public metaLRT;
    address public stETH;
    address public wstETH;

    constructor(address _stETH, address _wstETH, address _metaLRT) {
        stETH = _stETH;
        wstETH = _wstETH;
        metaLRT = _metaLRT;
    }

    function deposit(uint256 stETHAmount) external returns (uint256) {

        address caller = msg.sender;

        IERC20(stETH).safeTransferFrom(caller, address(this), stETHAmount);
        stETHAmount = IERC20(stETH).balanceOf(address(this));
        IERC20(stETH).approve(wstETH, stETHAmount);

        uint256 wstETHAmount = IRToken(wstETH).wrap(stETHAmount);
        IERC20(wstETH).approve(metaLRT, wstETHAmount);

        return IERC4626(metaLRT).deposit(wstETHAmount, caller);
    }
    function redeem(uint256 shares) external returns (uint256) {
        
        address caller = msg.sender;

        IERC4626(metaLRT).redeem(shares, address(this), caller);
        uint256 wstETHAmount = IERC20(wstETH).balanceOf(address(this));
        uint256 stETHAmount = IRToken(wstETH).unwrap(wstETHAmount);

        IERC20(stETH).safeTransfer(caller, stETHAmount);

        return stETHAmount;
    }
    function mint(uint256 shares) external returns (uint256) { 

        address caller = msg.sender;
        uint256 wstETHAmount = IERC4626(metaLRT).previewMint(shares);
        uint256 stETHAmount = IRToken(wstETH).getStETHByWstETH(wstETHAmount);

        IERC20(stETH).safeTransferFrom(caller, address(this), stETHAmount);
        stETHAmount = IERC20(stETH).balanceOf(address(this));
        IERC20(stETH).approve(wstETH, stETHAmount);
        wstETHAmount = IRToken(wstETH).wrap(stETHAmount);
        IERC20(wstETH).approve(metaLRT, wstETHAmount);

        return IERC4626(metaLRT).mint(shares, caller);
    }
    function withdraw(uint256 stETHAmount) external returns (uint256) { 

        address caller = msg.sender;
        uint256 wstETHAmount = IRToken(wstETH).getWstETHByStETH(stETHAmount);
        uint256 shares = IERC4626(metaLRT).previewWithdraw(wstETHAmount);

        shares = IERC4626(metaLRT).withdraw(wstETHAmount, address(this), caller);
        wstETHAmount = IERC20(wstETH).balanceOf(address(this));
        stETHAmount = IRToken(wstETH).unwrap(wstETHAmount);

        IERC20(stETH).safeTransfer(caller, stETHAmount);

        return shares;
    }
}
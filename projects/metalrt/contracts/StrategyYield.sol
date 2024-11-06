// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./StrategyBase.sol";
import "./interfaces/IRatioAdapter.sol";
import { IERC20    } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface InceptionVault {
    function deposit(uint256 amount, address receiver) external returns (uint256);
    function flashWithdraw(uint256 iShares, address receiver) external;
}

interface IWrapper {
    function wrap(uint256) external returns (uint256);
    function unwrap(uint256) external returns (uint256);
}

contract StrategyYield is StrategyBase {

    using SafeERC20 for IERC20;

    address public derivative;
    address public rebase;
    IRatioAdapter public ratioAdapter;

    modifier onlyMetaLRT {
        if (msg.sender != metalrt) revert();
        _;
    }

    constructor(address _metlrt, address _underlying, address _target, address _derivative, address _rebase, address _ratioAdapter) StrategyBase(_metlrt, _underlying, _target) {

        derivative = _derivative;
        rebase = _rebase;
        ratioAdapter = IRatioAdapter(_ratioAdapter);
    }

    function deposit(uint256 _amount) external override virtual onlyMetaLRT returns(uint256)  {

        return _deposit(_amount, msg.sender);
    }
    function withdraw(uint256 _iShares) external override virtual onlyMetaLRT returns(uint256)  {

        return _withdraw(_iShares, address(this));
    }
    function _deposit(uint256 amount, address receiver) internal returns(uint256) {

        IERC20(underlying).safeTransferFrom(msg.sender, address(this), amount);
        uint256 xAmount = IWrapper(underlying).unwrap(amount);

        IERC20(rebase).approve(target, xAmount);
        return InceptionVault(target).deposit(xAmount, receiver);
    }

    function _withdraw(uint256 iShares, address receiver) internal returns (uint256) {

        IERC20(derivative).safeTransferFrom(msg.sender, address(this), iShares);
        InceptionVault(target).flashWithdraw(iShares, receiver);

        uint256 xAmount = IERC20(rebase).balanceOf(address(this));
        IERC20(rebase).approve(underlying, xAmount);

        uint256 amount = IWrapper(underlying).wrap(xAmount);
        IERC20(underlying).safeTransfer(metalrt, amount);
    }

    function totalStrategy() external virtual view override returns (uint256) { 

        return IERC20(derivative).balanceOf(metalrt);
    }
    function totalStrategyETH() external virtual view override returns (uint256) {

        return ratioAdapter.toValue(derivative, IERC20(derivative).balanceOf(metalrt));
    }
}
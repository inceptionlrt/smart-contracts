// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./StrategyBase.sol";

interface InceptionVault {
    function deposit(uint256 amount, address receiver) external returns (uint256);
    function withdraw(uint256 iShares, address receiver) external; // TODO flashWithdraw or normal ?
}

contract StrategyYield is StrategyBase {

    constructor(address _asset, address _target) StrategyBase(_asset, _target) {}

    function deposit(uint256 _amount) external override virtual returns(uint256) {
        return _deposit(_amount, msg.sender);
    }
    function withdraw(uint256 _iShares) external override virtual returns(uint256) {
        _withdraw(_iShares, msg.sender); return 0;
    }

    function _deposit(uint256 amount, address receiver) internal returns(uint256) {
        return InceptionVault(asset).deposit(amount, receiver);
    }

    function _withdraw(uint256 iShares, address receiver) internal {
        InceptionVault(asset).withdraw(iShares, receiver);
    }
}
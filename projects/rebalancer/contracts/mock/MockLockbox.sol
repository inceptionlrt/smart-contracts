// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "../interfaces/IXERC20Lockbox.sol";

contract MockLockbox is IXERC20Lockbox {
    using SafeERC20 for IERC20;
    // The address of the ERC20 token associated with this lockbox
    IERC20 public erc20;
    // The XERC20 token interface
    IERC20 public xerc20;
    // Track if the lockbox is native or non-native (false = ERC20, true = native)
    bool public isNative;

    constructor(IERC20 _erc20, IERC20 _xerc20, bool _isNative) {
        erc20 = _erc20;
        xerc20 = _xerc20;
        isNative = _isNative;
    }

    function XERC20() external view override returns (IERC20) {
        return xerc20;
    }

    function ERC20() external view override returns (IERC20) {
        return erc20;
    }

    // Deposit ERC20 tokens into the lockbox
    function deposit(uint256 _amount) external override {
        erc20.safeTransferFrom(msg.sender, address(this), _amount);
        emit Deposit(address(this), _amount);
    }
    function depositTo(address _user, uint256 _amount) external override {
        //just to make it compile
    }

    function depositNativeTo(address _user) external payable override {
        //just to make it compile
    }

    // Withdraw ERC20 tokens from the lockbox
    function withdraw(uint256 _amount) external override {
        //just to make it compile
    }

    function withdrawTo(address _user, uint256 _amount) external override {
        //just to make it compile
    }
}

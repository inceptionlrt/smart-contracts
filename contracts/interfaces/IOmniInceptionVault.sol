// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IInceptionVault.sol";

interface IOmniInceptionVault is IInceptionVault {

    event TargetCapacityChanged(uint256 prevValue, uint256 newValue);
}

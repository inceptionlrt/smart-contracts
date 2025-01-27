// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.28;

interface IMellowHandler {
    function getTotalDeposited() external view returns (uint256);

    function MAX_TARGET_PERCENT() external view returns (uint256);

    function targetCapacity() external view returns (uint256);

    function getFreeBalance() external view returns (uint256 total);
}

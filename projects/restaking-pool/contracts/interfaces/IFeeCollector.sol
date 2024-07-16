// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFeeCollector {
    /* errors */

    error FeeCollectorTransferFailed(address to);

    error CommissionNotInRange();

    /* events */

    event Received(address indexed sender, uint256 amount);

    event CommissionChanged(uint16 prevValue, uint16 newValue);

    event Withdrawn(
        address indexed pool,
        address indexed treasury,
        uint256 rewards,
        uint256 fee
    );

    /* functions */

    function withdraw() external;
}

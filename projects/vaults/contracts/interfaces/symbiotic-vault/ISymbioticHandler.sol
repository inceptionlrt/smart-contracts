// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISymbioticHandler {
    /**
     * @dev Epoch represents the period of the rebalancing process
     * @dev Receiver is a receiver of assets in claim()
     * @dev Amount represents the exact amount of the asset to be claimed
     */
    struct Withdrawal {
        uint256 epoch;
        address receiver;
        uint256 amount;
    }

    event StartMellowWithdrawal(address indexed stakerAddress, uint256 amount);

    event DelegatedTo(
        address indexed stakerAddress,
        address indexed operatorAddress,
        uint256 amount
    );

    event WithdrawalClaimed(uint256 totalAmount);

    event TargetCapacityChanged(uint256 prevValue, uint256 newValue);
}

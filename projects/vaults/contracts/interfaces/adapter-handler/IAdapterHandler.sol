// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAdapterHandler {
    event DelegatedTo(
        address indexed stakerAddress,
        address indexed operatorAddress,
        uint256 amount
    );

    event UndelegatedFrom(
        address indexed adapter,
        address indexed vault,
        uint256 indexed actualAmounts,
        uint256 claimedAmount,
        uint256 epoch
    );

    event ClaimedFrom(
        address indexed adapter,
        address indexed vault,
        uint256 claimedAmount,
        uint256 epoch
    );

    event TargetCapacityChanged(uint256 prevValue, uint256 newValue);

    event AdapterAdded(address);

    event AdapterRemoved(address);

    struct __deprecated_Withdrawal {
        uint256 epoch;
        address receiver;
        uint256 amount;
    }
}

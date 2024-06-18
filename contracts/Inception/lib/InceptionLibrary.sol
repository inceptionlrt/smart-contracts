// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/// @author The InceptionLRT team
/// @title The InceptionLibrary library
/// @dev TODO
library InceptionLibrary {
    function calculateDepositBonus(
        uint256 amount,
        uint256 capacity,
        uint256 optimalCapacity,
        uint256 targetCapacity
    ) external pure returns (uint256 bonus) {
        if (amount > 0 && capacity < optimalCapacity) {
            uint256 replenished = amount;
            if (optimalCapacity < capacity + amount) {
                replenished = optimalCapacity - capacity;
            }
            uint256 bonusPercent = 15 *
                1e15 -
                (50 * 1e15 * (capacity + replenished / 2)) /
                targetCapacity;
            capacity += replenished;
            bonus += (replenished * bonusPercent) / 1e18;
            amount -= replenished;
        }
        if (amount > 0 && capacity <= targetCapacity) {
            uint256 replenished = targetCapacity > capacity + amount
                ? amount
                : targetCapacity - capacity;
            bonus += (replenished * 25) / 10000;
        }
    }

    function calculateWithdrawalFee(
        uint256 amount,
        uint256 currentCapacity,
        uint256 optimalCapacity,
        uint256 targetCapacity
    ) external pure returns (uint256 bonus) {
        if (amount > 0 && currentCapacity < optimalCapacity) {
            uint256 replenished = amount;
            if (optimalCapacity < currentCapacity + amount)
                replenished = optimalCapacity - currentCapacity;
            uint256 bonusPercent = 15 *
                1e15 -
                (50 * 1e15 * (currentCapacity + replenished / 2)) /
                targetCapacity;
            currentCapacity += replenished;
            bonus += (replenished * bonusPercent) / 1e18;
            amount -= replenished;
        }
        if (amount > 0 && currentCapacity <= targetCapacity) {
            uint256 replenished = targetCapacity > currentCapacity + amount
                ? amount
                : targetCapacity - currentCapacity;
            currentCapacity += (replenished * 25) / 10000;
        }
        return bonus;
    }
}

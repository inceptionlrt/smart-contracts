// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @author The InceptionLRT team
/// @title The InceptionLibrary library
/// @dev It serves two primary functions:
/// 1. Flash vault-related logic for the calculations of deposit bonus and withdrawal fee
/// 2. Conversions between shares and assets
library InceptionLibrary {
    uint256 constant MAX_PERCENT = 100 * 1e8;

    /************************************************************
     ************************ Flash Vault ***********************
     ************************************************************/

    function calculateDepositBonus(
        uint256 amount,
        uint256 capacity,
        uint256 optimalCapacity,
        uint256 optimalBonusRate,
        uint256 maxDepositBonusRate,
        uint256 targetCapacity
    ) external pure returns (uint256 bonus) {
        /// @dev the utilization rate is in the range [0:25] %
        if (amount > 0 && capacity < optimalCapacity) {
            uint256 replenished = amount;
            if (optimalCapacity < capacity + amount)
                replenished = optimalCapacity - capacity;

            uint256 bonusSlope = ((maxDepositBonusRate - optimalBonusRate) *
                1e18) / ((optimalCapacity * 1e18) / targetCapacity);
            uint256 bonusPercent = maxDepositBonusRate -
                (bonusSlope * (capacity + replenished / 2)) /
                targetCapacity;

            capacity += replenished;
            bonus += (replenished * bonusPercent) / MAX_PERCENT;
            amount -= replenished;
        }
        /// @dev the utilization rate is in the range [25: ] %
        if (amount > 0 && capacity <= targetCapacity) {
            uint256 replenished = targetCapacity > capacity + amount
                ? amount
                : targetCapacity - capacity;

            bonus += (replenished * optimalBonusRate) / MAX_PERCENT;
        }
    }

    function calculateWithdrawalFee(
        uint256 amount,
        uint256 capacity,
        uint256 optimalCapacity,
        uint256 optimaFeeRate,
        uint256 maxFlashWithdrawalFeeRate,
        uint256 targetCapacity
    ) external pure returns (uint256 fee) {
        /// @dev the utilization rate is in the range [100:25] %
        if (amount > 0 && capacity > optimalCapacity) {
            uint256 replenished = amount;
            if (capacity - amount < optimalCapacity)
                replenished = capacity - optimalCapacity;

            fee += (replenished * optimaFeeRate) / MAX_PERCENT;
            amount -= replenished;
            capacity -= replenished;
            if (fee == 0) ++fee;
        }
        /// @dev the utilization rate is in the range [25:0] %
        if (amount > 0) {
            uint256 feeSlope = ((maxFlashWithdrawalFeeRate - optimaFeeRate) *
                1e18) / ((optimalCapacity * 1e18) / targetCapacity);
            uint256 bonusPercent = maxFlashWithdrawalFeeRate -
                (feeSlope * (capacity - amount / 2)) /
                targetCapacity;
            fee += (amount * bonusPercent) / MAX_PERCENT;
            if (fee == 0) ++fee;
        }
        if (fee == 0) ++fee;
    }
}

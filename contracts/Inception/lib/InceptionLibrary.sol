// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/// @author The InceptionLRT team
/// @title The InceptionLibrary library
/// @dev TODO
library InceptionLibrary {
    uint256 constant MAX_PERCENT = 100 * 1e4;

    function calculateDepositBonus(
        uint256 amount,
        uint256 capacity,
        uint256 optimalCapacity,
        uint256 optimalBonusRate,
        uint256 maxDepositBonusPercent, //  15 * 1e15,
        uint256 bonusSlope, //  50 * 1e15,
        uint256 targetCapacity
    ) external pure returns (uint256 bonus) {
        /// @dev the utilization rate is in the range [0:25] %
        if (amount > 0 && capacity < optimalCapacity) {
            uint256 replenished = amount;
            if (optimalCapacity < capacity + amount)
                replenished = optimalCapacity - capacity;

            uint256 bonusPercent = maxDepositBonusPercent -
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
        uint256 maxFlashWithdrawalFeePercent,
        uint256 feeSlope,
        uint256 targetCapacity
    ) external pure returns (uint256 fee) {
        /// @dev the utilization rate is greater 1, [ :100] %
        if (amount > 0 && capacity > targetCapacity) {
            uint256 replenished = amount;
            if (capacity - amount < targetCapacity)
                replenished = capacity - targetCapacity;

            amount -= replenished;
            capacity -= replenished;
        }
        /// @dev the utilization rate is in the range [100:25] %
        if (amount > 0 && capacity > optimalCapacity) {
            uint256 replenished = amount;
            if (capacity - amount < optimalCapacity)
                replenished = capacity - optimalCapacity;

            fee += (replenished * optimaFeeRate) / MAX_PERCENT; // 0.5%
            amount -= replenished;
            capacity -= replenished;
        }
        /// @dev the utilization rate is in the range [25:0] %
        if (amount > 0) {
            uint256 bonusPercent = maxFlashWithdrawalFeePercent -
                (feeSlope * (capacity - amount / 2)) /
                targetCapacity;
            fee += (amount * bonusPercent) / MAX_PERCENT;
        }
    }
}

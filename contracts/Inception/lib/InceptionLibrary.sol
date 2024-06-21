// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
        uint256 maxDepositBonusPercent,
        uint256 bonusSlope,
        uint256 targetCapacity
    ) internal pure returns (uint256 bonus) {
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
    ) internal pure returns (uint256 fee) {
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

            fee += (replenished * optimaFeeRate) / MAX_PERCENT;
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

    /********************************************************
     ************************ Convert ***********************
     ********************************************************/

    function saturatingMultiply(
        uint256 a,
        uint256 b
    ) internal pure returns (uint256) {
        unchecked {
            if (a == 0) return 0;
            uint256 c = a * b;
            if (c / a != b) return type(uint256).max;
            return c;
        }
    }

    function saturatingAdd(
        uint256 a,
        uint256 b
    ) internal pure returns (uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return type(uint256).max;
            return c;
        }
    }

    // Preconditions:
    //  1. a may be arbitrary (up to 2 ** 256 - 1)
    //  2. b * c < 2 ** 256
    // Returned value: min(floor((a * b) / c), 2 ** 256 - 1)
    function multiplyAndDivideFloor(
        uint256 a,
        uint256 b,
        uint256 c
    ) internal pure returns (uint256) {
        return
            saturatingAdd(
                saturatingMultiply(a / c, b),
                ((a % c) * b) / c // can't fail because of assumption 2.
            );
    }

    // Preconditions:
    //  1. a may be arbitrary (up to 2 ** 256 - 1)
    //  2. b * c < 2 ** 256
    // Returned value: min(ceil((a * b) / c), 2 ** 256 - 1)
    function multiplyAndDivideCeil(
        uint256 a,
        uint256 b,
        uint256 c
    ) internal pure returns (uint256) {
        require(c != 0, "c == 0");
        return
            saturatingAdd(
                saturatingMultiply(a / c, b),
                ((a % c) * b + (c - 1)) / c // can't fail because of assumption 2.
            );
    }
}

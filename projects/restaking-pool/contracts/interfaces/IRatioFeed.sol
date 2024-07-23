// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRatioFeed {
    enum RatioError {
        NoError,
        TooOften, // ratio was updated less than 12 hours ago
        GreaterThanPrevious, // new ratio cannot be greater than old
        NotInThreshold, // new ratio too low, not in threshold range
        GreaterThanInitial // new ratio is greater than {INITIAL_RATIO}
    }

    struct HistoricalRatios {
        uint64[9] historicalRatios;
        uint40 lastUpdate;
    }

    /* errors */

    error RatioNotUpdated(RatioError);
    error RatioThresholdNotInRange();

    /* events */

    event RatioThresholdChanged(uint256 oldValue, uint256 newValue);
    event RatioUpdated(
        address indexed tokenAddress,
        uint256 oldRatio,
        uint256 newRatio
    );

    /* functions */

    function updateRatio(address token, uint256 ratio) external;
    function getRatio(address token) external view returns (uint256 ratio);
}

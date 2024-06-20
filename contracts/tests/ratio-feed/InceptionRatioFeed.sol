// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Mock
contract InceptionRatioFeed {
    struct HistoricalRatios {
        uint64[9] historicalRatios;
        uint40 lastUpdate;
    }

    /// @dev 100000000
    uint32 public constant MAX_THRESHOLD = uint32(1e8);

    address public inceptionOperator;

    mapping(address => uint256) private _ratios;
    mapping(address => HistoricalRatios) public historicalRatios;

    /// @dev use this instead of HistoricalRatios.lastUpdate to check for 12hr ratio update timeout
    mapping(address => uint256) private _ratioUpdates;

    /// @dev diff between the current ratio and a new one in %(0.000001 ... 100%)
    uint256 public ratioThreshold;

    function initialize() external {
        inceptionOperator = msg.sender;
    }

    function updateRatioBatch(
        address[] calldata addresses,
        uint256[] calldata ratios
    ) external {
        uint256 numOfRatios = addresses.length;
        for (uint256 i = 0; i < numOfRatios; ) {
            address tokenAddr = addresses[i];
            uint256 newRatio = ratios[i];

            _ratios[tokenAddr] = newRatio;
            _ratioUpdates[tokenAddr] = uint40(block.timestamp);

            // let's compare with the new ratio
            HistoricalRatios storage hisRatio = historicalRatios[tokenAddr];
            if (block.timestamp - hisRatio.lastUpdate > 1 days - 1 minutes) {
                uint64 latestOffset = hisRatio.historicalRatios[0];
                hisRatio.historicalRatios[
                    ((latestOffset + 1) % 8) + 1
                ] = uint64(newRatio);
                hisRatio.historicalRatios[0] = latestOffset + 1;
                hisRatio.lastUpdate = uint40(block.timestamp);
            }
            unchecked {
                ++i;
            }
        }
    }

    function _checkRatioRules(
        uint256 lastUpdated,
        uint256 newRatio,
        uint256 oldRatio
    ) internal view returns (bool valid, string memory reason) {
        // initialization of the first ratio -> skip checks
        if (oldRatio == 0) return (valid = true, reason);

        if (block.timestamp - lastUpdated < 12 hours)
            return (valid, reason = "update time range exceeds");

        // new ratio should be not greater than a previous one
        if (newRatio > oldRatio)
            return (valid, reason = "new ratio is greater than old");

        // new ratio should be in the range (oldRatio - threshold , oldRatio]
        uint256 threshold = (oldRatio * ratioThreshold) / MAX_THRESHOLD;
        if (newRatio < oldRatio - threshold)
            return (valid, reason = "new ratio too low");

        return (valid = true, reason);
    }

    function averagePercentageRate(
        address token,
        uint256 day
    ) external view returns (uint256) {
        HistoricalRatios storage hisRatio = historicalRatios[token];
        uint64 latestOffset = hisRatio.historicalRatios[0];

        uint256 oldestRatio = hisRatio.historicalRatios[
            ((latestOffset - day) % 8) + 1
        ];
        uint256 newestRatio = hisRatio.historicalRatios[
            ((latestOffset) % 8) + 1
        ];

        if (oldestRatio <= newestRatio) {
            return 0;
        }

        return
            ((oldestRatio - newestRatio) * 10 ** 20 * 365) /
            (newestRatio * (day));
    }

    function getRatioFor(address token) external view returns (uint256) {
        return _ratios[token];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Mock of RatioFeed for testing
 */
contract MockRatioFeed {
    uint256 public ratioThreshold;
    mapping(address => uint256) private _mockRatios;
    mapping(address => uint256) private _ratioUpdates;

    event MockRatioUpdated(address token, uint256 oldRatio, uint256 newRatio);
    event RatioThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    /**
     * @notice Updates the ratio for a specific token (for testing purposes)
     * @param token The address of the token to update the ratio for.
     * @param newRatio The new ratio value to set.
     */
    function updateMockRatio(address token, uint256 newRatio) external {
        uint256 oldRatio = _mockRatios[token];
        _mockRatios[token] = newRatio;
        _ratioUpdates[token] = block.timestamp;

        emit MockRatioUpdated(token, oldRatio, newRatio);
    }

    /**
     * @notice Directly set the ratio threshold for testing.
     * @param newThreshold The new threshold value to set.
     */
    function setMockRatioThreshold(uint256 newThreshold) external {
        emit RatioThresholdUpdated(ratioThreshold, newThreshold);
        ratioThreshold = newThreshold;
    }

    /**
     * @notice Get the ratio for a token.
     * @param token The address of the token to get the ratio for.
     * @return The ratio of the token.
     */
    function getRatio(address token) external view returns (uint256) {
        return _mockRatios[token];
    }

    /**
     * @notice Get the ratio for a token (for compatibility with original interface).
     * @param token The address of the token to get the ratio for.
     * @return The ratio of the token.
     */
    function getRatioFor(address token) external view returns (uint256) {
        return _mockRatios[token];
    }

    /**
     * @notice Returns the last update time for the token's ratio (mocked value).
     * @param token The address of the token to check.
     * @return Last update timestamp of the ratio.
     */
    function getLastUpdate(address token) external view returns (uint256) {
        return _ratioUpdates[token];
    }
}

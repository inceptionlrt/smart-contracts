// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInceptionRatioFeedErrors {
    error OperatorUnauthorizedAccount(address account);

    error InconsistentInputData();

    error NullParams();

    error RatioThresholdNotSet();

    error NewRatioThresholdInvalid();

    error IncorrectDay(uint256 day);

    error IncorrectToken(address token);
}

interface IInceptionRatioFeed {
    event OperatorUpdated(address prevValue, address newValue);

    event RatioUpdated(
        address indexed tokenAddress,
        uint256 prevValue,
        uint256 newValue
    );

    event RatioNotUpdated(
        address indexed tokenAddress,
        uint256 failedRatio,
        string reason
    );

    event RatioThresholdChanged(uint256 prevValue, uint256 newValue);

    function updateRatioBatch(
        address[] calldata addresses,
        uint256[] calldata ratios
    ) external;

    function getRatioFor(address) external view returns (uint256);
}

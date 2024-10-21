// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "../interfaces/IInceptionRatioFeed.sol";

/// @author The InceptionLRT team
/// @title InceptionRatioFeed Contract
/// @notice Holds the up-to-date ratios for the bridged LRTs.
contract InceptionRatioFeed is
    OwnableUpgradeable,
    PausableUpgradeable,
    IInceptionRatioFeed,
    IInceptionRatioFeedErrors
{
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

    modifier onlyOperator() {
        if (msg.sender != owner() && msg.sender != inceptionOperator)
            revert OperatorUnauthorizedAccount(msg.sender);
        _;
    }

    function initialize(address operator) external initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();

        inceptionOperator = operator;
        emit OperatorUpdated(address(0), operator);
    }

    function updateRatioBatch(
        address[] calldata addresses,
        uint256[] calldata ratios
    ) external override whenNotPaused onlyOperator {
        if (ratioThreshold == 0) revert RatioThresholdNotSet();

        uint256 numOfRatios = addresses.length;
        if (numOfRatios != ratios.length) revert InconsistentInputData();

        for (uint256 i = 0; i < numOfRatios; ) {
            address tokenAddr = addresses[i];
            uint256 lastUpdate = _ratioUpdates[tokenAddr];
            uint256 oldRatio = _ratios[tokenAddr];
            uint256 newRatio = ratios[i];

            (bool valid, string memory reason) = _checkRatioRules(
                lastUpdate,
                newRatio,
                oldRatio
            );

            if (!valid) {
                emit RatioNotUpdated(tokenAddr, newRatio, reason);
                unchecked {
                    ++i;
                }
                continue;
            }

            _ratios[tokenAddr] = newRatio;
            emit RatioUpdated(tokenAddr, oldRatio, newRatio);

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
        if (token == address(0)) revert NullParams();
        if (day == 0 || day > 7) revert IncorrectDay(day);

        HistoricalRatios storage hisRatio = historicalRatios[token];
        uint64 latestOffset = hisRatio.historicalRatios[0];
        if (latestOffset == 0) revert IncorrectToken(token);
        if (latestOffset < day) revert IncorrectDay(day);

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

    function getRatioFor(
        address token
    ) external view override returns (uint256) {
        return _ratios[token];
    }

    function repairRatioFor(address token, uint256 ratio) external onlyOwner {
        if (token == address(0) || ratio == 0) revert NullParams();

        uint256 oldRatio = _ratios[token];
        _ratios[token] = ratio;
        emit RatioUpdated(token, oldRatio, ratio);
    }

    function setRatioThreshold(uint256 newValue) external onlyOwner {
        if (newValue >= MAX_THRESHOLD || newValue == 0)
            revert NewRatioThresholdInvalid();

        emit RatioThresholdChanged(ratioThreshold, newValue);
        ratioThreshold = newValue;
    }

    function setInceptionOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert NullParams();

        emit OperatorUpdated(inceptionOperator, newOperator);
        inceptionOperator = newOperator;
    }

    /*///////////////////////////////
    ////// Pausable functions //////
    /////////////////////////////*/

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

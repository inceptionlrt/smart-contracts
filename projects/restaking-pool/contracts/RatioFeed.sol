// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./Configurable.sol";
import "./interfaces/IRatioFeed.sol";
import "./interfaces/IProtocolConfig.sol";

/**
 * @title Stores ratio of inETH
 * @author GenesisLRT
 */
contract RatioFeed is Configurable, IRatioFeed {
    uint32 public constant MAX_THRESHOLD = uint32(1e8); // 100000000
    uint256 public constant INITIAL_RATIO = 1e18; // 1.0

    mapping(address => uint256) internal _ratios;
    mapping(address => HistoricalRatios) public historicalRatios;

    /**
     * @notice diff between the current ratio and a new one in %(0.000001 ... 100%)
     */
    uint256 public ratioThreshold;

    /**
     * @dev use this instead of HistoricalRatios.lastUpdate to check for 12hr ratio update timeout
     */
    mapping(address => uint256) private _ratioUpdates;

    /*******************************************************************************
                        CONSTRUCTOR
    *******************************************************************************/

    /// @dev https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#initializing_the_implementation_contract
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IProtocolConfig config,
        uint256 ratioThreshold_
    ) public initializer {
        __Configurable_init(config);
        __RatioFeed_init(ratioThreshold_);
    }

    function __RatioFeed_init(
        uint256 ratioThreshold_
    ) internal onlyInitializing {
        _setRatioThreshold(ratioThreshold_);
    }

    /*******************************************************************************
                        WRITE FUNCTIONS
    *******************************************************************************/

    /**
     *
     * @notice Update the `token` ratio to `newRatio`.
     */
    function updateRatio(
        address token,
        uint256 newRatio
    ) public override onlyOperator {
        uint256 lastUpdate = _ratioUpdates[token];
        uint256 oldRatio = _ratios[token];

        RatioError err = _checkRatioRules(lastUpdate, newRatio, oldRatio);

        if (err != RatioError.NoError) {
            revert RatioNotUpdated(err);
        }

        _ratios[token] = newRatio;
        emit RatioUpdated(token, oldRatio, newRatio);

        _ratioUpdates[token] = uint40(block.timestamp);

        HistoricalRatios storage hisRatio = historicalRatios[token];
        if (block.timestamp - hisRatio.lastUpdate > 1 days - 1 minutes) {
            uint64 latestOffset = hisRatio.historicalRatios[0];
            hisRatio.historicalRatios[((latestOffset + 1) % 8) + 1] = uint64(
                newRatio
            );
            hisRatio.historicalRatios[0] = latestOffset + 1;
            hisRatio.lastUpdate = uint40(block.timestamp);
        }
    }

    function _checkRatioRules(
        uint256 lastUpdated,
        uint256 newRatio,
        uint256 oldRatio
    ) internal view returns (RatioError) {
        if (oldRatio == 0) {
            if (newRatio > INITIAL_RATIO) {
                return RatioError.GreaterThanInitial;
            }
            return RatioError.NoError;
        }

        if (block.timestamp - lastUpdated < 12 hours) {
            return RatioError.TooOften;
        }

        if (newRatio > oldRatio) {
            return RatioError.GreaterThanPrevious;
        }

        uint256 threshold = (oldRatio * ratioThreshold) / MAX_THRESHOLD;
        if (newRatio < oldRatio - threshold) {
            return RatioError.NotInThreshold;
        }

        return RatioError.NoError;
    }

    /**
     *
     * @notice Force update of the `token` ratio to `newRatio` .
     * @dev Callable only by governance in case of malicious operator.
     */
    function repairRatio(
        address token,
        uint256 newRatio
    ) public onlyGovernance {
        if (newRatio > INITIAL_RATIO || newRatio == 0) {
            revert RatioNotUpdated(RatioError.NotInThreshold);
        }
        emit RatioUpdated(token, _ratios[token], newRatio);
        _ratios[token] = newRatio;
    }

    function setRatioThreshold(uint256 newValue) external onlyGovernance {
        _setRatioThreshold(newValue);
    }

    function _setRatioThreshold(uint256 value) internal {
        if (value > MAX_THRESHOLD || value == 0) {
            revert RatioThresholdNotInRange();
        }
        emit RatioThresholdChanged(ratioThreshold, value);
        ratioThreshold = value;
    }

    /*******************************************************************************
                        READ FUNCTIONS
    *******************************************************************************/

    /**
     * @notice Get ratio of a token.
     */
    function getRatio(address token) public view override returns (uint256) {
        return _ratios[token];
    }

    /**
     * @notice Returns APR based on ratio changes for `day`s
     */
    function averagePercentageRate(
        address token,
        uint8 day
    ) external view returns (uint256) {
        require(day > 0 && day < 8, "day should be from 1 to 7");

        HistoricalRatios storage hisRatio = historicalRatios[token];
        uint64 latestOffset = hisRatio.historicalRatios[0];

        uint256 oldestRatio = hisRatio.historicalRatios[
            ((latestOffset - day) % 8) + 1
        ];
        uint256 newestRatio = hisRatio.historicalRatios[(latestOffset % 8) + 1];

        if (oldestRatio < newestRatio) {
            return 0;
        }

        return
            ((oldestRatio - newestRatio) * 10 ** 20 * 365) /
            (oldestRatio * (day));
    }
}

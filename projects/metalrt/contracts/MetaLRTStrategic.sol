// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MetaLRTCore, IERC20 } from "./MetaLRTCore.sol";
import { IMetaLRTStrategic   } from "./interfaces/IMetaLRTStrategic.sol";

import { IStrategyBase  } from "./interfaces/IStrategyBase.sol";
import { Math           } from "@openzeppelin/contracts/utils/math/Math.sol";

// --- MetaLRT Strategic ---
abstract contract MetaLRTStrategic is MetaLRTCore, IMetaLRTStrategic {

    // --- Wrappers ---
    using Math for uint256;

    // --- Constants ---
    uint256 public constant MAX_ALLOCATION = 1e18;  // 1e18 = 100%

    // --- Vars ---
    address[] public strategies;
    mapping(address => StrategyStats) public stats;
    address public sOperator;
    uint256 public tolerance;
    uint256 public totalDeposit;

    uint256[46] private __reserver;

    modifier onlySOperatorOrOwner {
        if (msg.sender != sOperator || msg.sender != owner()) revert NotSOperatorOrOwner();
        _;
    }

    // --- Constructor ---
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    // --- Init ---
    function __MetaLRTStrategic_init() internal onlyInitializing {

    }
    function initialize(string memory _name, string memory _symbol, uint256 _yieldMargin, address _underlying) external override initializer {
        
        __MetaLRTCore_init(_name, _symbol, _yieldMargin, _underlying);
        __MetaLRTStrategic_init();
    }

    // --- Strategies ---
    function sDeposit(address _strategy, uint256 _amount) public virtual onlySOperatorOrOwner {

        totalDeposit += _amount;
        stats[_strategy].deposit += _amount;

        IERC20(asset()).approve(_strategy, _amount);
        IStrategyBase(_strategy).deposit(_amount);
    }
    function sDepositAuto(uint256 _amount) external virtual onlySOperatorOrOwner {

        (, uint256[] memory _subAmounts) = split(_amount);
        for (uint8 i = 0; i < _subAmounts.length;) {

            sDeposit(strategies[i], _subAmounts[i]);

            unchecked { i++; }
        }
    }
    function sWithdraw(address _strategy, uint256 _amount) public virtual  onlySOperatorOrOwner{

        totalDeposit -= _amount;
        stats[_strategy].deposit -= _amount;

        IStrategyBase(_strategy).withdraw(_amount);
    }
    function sWithdrawAuto(uint256 _amount) external virtual onlySOperatorOrOwner {

        (, uint256[] memory _subAmounts) = split(_amount);
        for (uint8 i = 0; i < _subAmounts.length;) {

            sWithdraw(strategies[i], _subAmounts[i]);

            unchecked { i++; }
        }
    }

    // --- Admin ---
    function setAllocations(address[] calldata strats, uint256[] calldata newTargets) external onlySOperatorOrOwner {

        for (uint8 i = 0; i < strategies.length; ){

            stats[strategies[i]].allocation = newTargets[i];
            

            unchecked { i++; }
        }

        require(checkAllocations());
    }
    function checkAllocations() internal view returns(bool) {
        uint256 totalAllocation;
        for(uint256 i = 0; i < strategies.length; i++) {
            if(stats[strategies[i]].active) {
                totalAllocation += stats[strategies[i]].allocation;
            }
        }

        return totalAllocation <= MAX_ALLOCATION;
    }
    // function setTolerance(uint256 _tolerance) external onlySOperatorOrOwner {
    //     tolerance = _tolerance;
    // }
    function addStrategy(address _strategy, uint256 _allocation) external onlyOwner {

        // if (!_exists(_strategy)) revert();
        strategies.push(_strategy);
        StrategyStats memory s = StrategyStats(_allocation, 0, true);
    }
    function removeStrategy(address _strategy) external onlyOwner {
        // First withdraw all funds, then remove
    }
    function _exists(address _strategy) internal {

    }

    // --- Views ---
    function split(uint256 _amount) public view returns (address[] memory _strategies, uint256[] memory _amounts) {
        _strategies = strategies;
        _amounts = new uint256[](_strategies.length);

        for (uint256 i = 0; i < _strategies.length; ) {
            _amounts[i] = _amount.mulDiv(stats[_strategies[i]].allocation, MAX_ALLOCATION, Math.Rounding.Floor);
            unchecked { i++; }
        }
    }
    function getTotalDepositedByStrategies(address _strategy) public view returns (uint256) {

        StrategyStats memory strategy = stats[_strategy];
        return strategy.deposit;
    }
}
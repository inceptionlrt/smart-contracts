// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MetaLRTCore       } from "./MetaLRTCore.sol";
import { IMetaLRTStrategic } from "./interfaces/IMetaLRTStrategic.sol";

import { SafeERC20     } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IStrategyBase } from "./interfaces/IStrategyBase.sol";
import { IERC20        } from "./MetaLRTCore.sol";
import { Math          } from "@openzeppelin/contracts/utils/math/Math.sol";

// --- MetaLRT Strategic ---
contract MetaLRTStrategic is MetaLRTCore, IMetaLRTStrategic {

    // --- Wrappers ---
    using SafeERC20 for IERC20;
    using Math for uint256;

    // --- Constants ---
    uint256 public constant MAX_ALLOCATION = 1e18;

    // --- Vars ---
    address[] public strategies;
    mapping(address => StrategyStats) public stats;
    address public sOperator;

    uint256[47] private __reserver;

    modifier onlySOperatorOrOwner {
        if (msg.sender != sOperator || msg.sender != owner()) revert();
        _;
    }

    // --- Constructor ---
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    // --- Init ---
    function __MetaLRTStrategic_init() internal onlyInitializing {
    }
    function initialize(string memory _name, string memory _symbol, uint256 _yieldMargin, address _underlying) external virtual override initializer {
        
        __MetaLRTCore_init(_name, _symbol, _yieldMargin, _underlying);
        __MetaLRTStrategic_init();
    }

    // --- Strategies ---
    function sDeposit(address _strategy, uint256 _amount) public virtual onlySOperatorOrOwner nonReentrant whenNotPaused {

        if (listed(_strategy) < 0) revert();
        if (totalAssets() < ratioAdapter.toValue(asset(), _amount)) revert();
        if (IERC20(asset()).balanceOf(address(this)) < _amount) revert();

        // TODO balance check before and after 
        IStrategyBase(_strategy).deposit(_amount); // TODO STRAT wstETH
    }
    function sDepositAuto(uint256 _amount) public virtual onlySOperatorOrOwner nonReentrant whenNotPaused {

        if (totalAssets() < ratioAdapter.toValue(asset(), _amount)) revert();
        if (IERC20(asset()).balanceOf(address(this)) < _amount) revert();

        (, uint256[] memory _subAmounts) = split(_amount);
        for (uint8 i = 0; i < _subAmounts.length;) {

            // TODO balance check before and after 
            IStrategyBase(strategies[i]).deposit(_subAmounts[i]);

            unchecked { i++; }
        }
    }
    function sWithdraw(address _strategy, uint256 _amount) public virtual  onlySOperatorOrOwner nonReentrant whenNotPaused {

        if (listed(_strategy) < 0) revert();  // TODO if _amount is wstETH, how can empty strat ?
        // TODO balance check before and after 
        IStrategyBase(_strategy).withdraw(_amount); // TODO STRAT wstETH
    }
    function sWithdrawAuto(uint256 _amount) public virtual onlySOperatorOrOwner nonReentrant whenNotPaused {

        (, uint256[] memory _subAmounts) = split(_amount);
        for (uint8 i = 0; i < _subAmounts.length;) {

            IStrategyBase(strategies[i]).withdraw(_amount);

            unchecked { i++; }
        }
    }

    // --- Admin ---
    function setAllocations(uint256[] calldata _allocations) external onlySOperatorOrOwner {

        if (strategies.length != _allocations.length) revert();
        uint256 totalAllocation;
        for (uint8 i = 0; i < strategies.length; ) {

            stats[strategies[i]].allocation = _allocations[i];

            totalAllocation += _allocations[i];

            unchecked { i++; }
        }

        if (totalAllocation != MAX_ALLOCATION) revert();
    }
    function setSOperator(address _sOperator) external onlySOperatorOrOwner {

        sOperator = _sOperator;
    }
    function addStrategy(address _strategy, address _derivative, uint256 _allocation) external onlyOwner {

        if (listed(_strategy) >= 0) revert();

        strategies.push(_strategy);
        StrategyStats memory s = StrategyStats(_allocation, _derivative);  // TODO derivative might be address(0) for point adapters

        IERC20(asset()).approve(_strategy, type(uint256).max);
        IERC20(_derivative).approve(_strategy, type(uint256).max);
    }
    function removeStrategy(address _strategy) external onlyOwner {

        int256 index = listed(_strategy);
        if (index < 0) revert();
        
        StrategyStats memory s = stats[_strategy];
        uint256 strategyBalance = IERC20(s.derivative).balanceOf(address(this));

        if (strategyBalance > 0) sWithdraw(_strategy, ratioAdapter.fromValue(asset(), ratioAdapter.toValue(s.derivative, strategyBalance)));  // TODO strategyBalance must be in wstETH

        IERC20(asset()).approve(_strategy, 0);
        IERC20(stats[_strategy].derivative).approve(_strategy, 0);

        strategies[uint256(index)] = strategies[strategies.length - 1];
        strategies.pop();
    }
    function listed(address _strategy) internal view returns (int8) {
        
        for (uint8 i = 0; i < strategies.length; ) {

            if (strategies[i] == _strategy) return int8(i);
            unchecked { i++; }
        }

        return -1;
    }
    function listedDerivative(address _derivative) internal view returns (int8, address _strategy) {
        
        for (uint8 i = 0; i < strategies.length; ) {

            if (stats[strategies[i]].derivative == _derivative) return (int8(i), strategies[i]);
            unchecked { i++; }
        }

        return (-1, _strategy);
    }
    function _claimYield() internal virtual override returns (uint256) {

        uint256 availableYields = getVaultYield();
        if (availableYields <= 0) return 0;

        uint256[] memory _subAmounts;
        uint256 assetBalance = ratioAdapter.toValue(asset(), IERC20(asset()).balanceOf(address(this)));

        if (assetBalance >= availableYields) {  // Send in wstETH if wstETH can cover yield
            IERC20(asset()).safeTransfer(yieldHeritor, availableYields);
            emit Claim(address(this), yieldHeritor, availableYields);
            return availableYields;
        } else if (assetBalance > 0) {  // Send wstETH first, remaining shared in derivatives based on proportions
            IERC20(asset()).safeTransfer(yieldHeritor, availableYields - (availableYields - assetBalance));
            (, _subAmounts) = split(availableYields - assetBalance);
        } else (, _subAmounts) = split(availableYields);

        for (uint8 i = 0; i < strategies.length; ) { // Send derivatives as yeild based on proportions

            IERC20(stats[strategies[i]].derivative).safeTransfer(yieldHeritor, _subAmounts[i]);
            unchecked { i++; }
        }
        
        emit Claim(address(this), yieldHeritor, availableYields);
        return availableYields;
    }


    // --- Views ---
    function split(uint256 _amount) public view returns (address[] memory _strategies, uint256[] memory _subAmounts) {

        _strategies = strategies;
        _subAmounts = new uint256[](_strategies.length);

        for (uint256 i = 0; i < _strategies.length; ) {
            _subAmounts[i] = _amount.mulDiv(stats[_strategies[i]].allocation, MAX_ALLOCATION, Math.Rounding.Floor);
            unchecked { i++; }
        }
    }
    function getSDepositETH(address _strategy) public view returns (uint256) {

        int256 index = listed(_strategy);
        if (index < 0) revert();
        return IERC20(stats[_strategy].derivative).balanceOf(address(this));  // TODO forward balance logic to strategy
    }
    function getSDepositByDerivativeETH(address _derivative) public view returns (uint256) {

        (int256 index, address _strategy )= listedDerivative(_derivative);
        if (index < 0) revert();
        return IERC20(stats[_strategy].derivative).balanceOf(address(this));  // TODO forward balance logic to strategy
    }
    function getSDepositETHTotal() public view returns (uint256 _total) {

        for (uint256 i = 0; i < strategies.length; ) {

            _total += getSDepositETH(strategies[i]);
            unchecked { i++; }
        }
    }
    function getVaultYield() public view virtual override returns (uint256) {
        uint256 totalBalance = getBalance();
        if (totalBalance <= yieldBalance) return 0;

        uint256 diffBalance = totalBalance - yieldBalance;

        uint256 yield = diffBalance * yieldMargin / MAX_YIELD_MARGIN;

        return yield;
    }
    function getBalance() public view virtual override returns (uint256 _total) {

        _total = ratioAdapter.toValue(asset(), IERC20(asset()).balanceOf(address(this)));
        _total = getSDepositETHTotal();
    }
    function totalAssets() public view virtual override returns (uint256) {
        return getBalance() - getVaultYield();
    }
}
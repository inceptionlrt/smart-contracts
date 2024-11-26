// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { PausableUpgradeable        } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { Ownable2StepUpgradeable    } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { ERC4626Upgradeable         } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { IMetaLRTCore               } from "./interfaces/IMetaLRTCore.sol";

import { SafeERC20, IERC20 } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { IRatioAdapter     } from "./interfaces/IRatioAdapter.sol";

// --- MetaLRT Basic ---
contract MetaLRTCore is ReentrancyGuardUpgradeable, PausableUpgradeable, Ownable2StepUpgradeable, ERC4626Upgradeable, IMetaLRTCore {
    
    // --- Wrappers ---
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 public constant MAX_YIELD_MARGIN = 1e18;

    // --- Vars ---
    address public yieldHeritor;        // Yield recipient
    uint256 public yieldMargin;         // Percentage of underlying's yield protocol gets, 1e18 = 100%
    uint256 public yieldBalance;        // Balance at which underlying's yield for protocol was last claimed
    IRatioAdapter public ratioAdapter;  // LST/LRT Ratio Source

    uint256[46] private __reserver;

    // --- Constructor ---
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    // --- Init ---
    function __MetaLRTCore_init(string memory _name, string memory _symbol, uint256 _yieldMargin, address _underlying) internal onlyInitializing {
        
        __ERC4626_init(IERC20(_underlying));
        __ERC20_init(_name, _symbol);
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();

        if (_yieldMargin > MAX_YIELD_MARGIN) revert MetaLRTCoreMaxMargin();
        yieldMargin = _yieldMargin;
        emit YieldMargin(0, _yieldMargin);
    }
    function initialize(string memory _name, string memory _symbol, uint256 _yieldMargin, address _underlying) external virtual initializer {

        __MetaLRTCore_init(_name, _symbol, _yieldMargin, _underlying);
    }

    // --- User ---
    function deposit(uint256 assets, address receiver) public override nonReentrant whenNotPaused returns (uint256) {

        address src = _msgSender();
        uint256 maxAssets = maxDeposit(receiver);

        if (assets <= 0) revert MetaLRTCoreInvalidAmount();
        if (receiver == address(0)) revert MetaLRTCoreZeroAddress();
        if (assets > maxAssets) revert ERC4626ExceededMaxDeposit(receiver, assets, maxAssets);

        _claimYield();
        uint256 shares = previewDeposit(ratioAdapter.toValue(asset(), assets));
        _deposit(src, receiver, assets, shares);

        yieldBalance = getBalance();

        return shares;
    }
    function redeem(uint256 shares, address receiver, address owner) public override nonReentrant whenNotPaused returns (uint256) {

        address src = _msgSender();
        uint256 maxShares = maxRedeem(owner);

        if (shares > maxShares) revert ERC4626ExceededMaxRedeem(owner, shares, maxShares);
        if (receiver == address(0)) revert MetaLRTCoreZeroAddress();

        uint256 assets = previewRedeem(shares);
        assets = ratioAdapter.fromValue(asset(), assets);
        _claimYield();

        yieldBalance = getBalance();

        _withdraw(src, receiver, owner, assets, shares);

        return assets;
    }
    function mint(uint256 shares, address receiver) public override nonReentrant whenNotPaused returns (uint256) { 

       address src = _msgSender();

        uint256 maxShares = maxMint(receiver);
        if (shares > maxShares) {
            revert ERC4626ExceededMaxMint(receiver, shares, maxShares);
        }
        
        _claimYield();
        uint256 assets = previewMint(shares);
        assets = ratioAdapter.fromValue(asset(), assets);
        _deposit(src, receiver, assets, shares);

        yieldBalance = getBalance();

        return assets;
    }
    function withdraw(uint256 assets, address receiver, address owner) public override nonReentrant whenNotPaused returns (uint256) { 

        address src = _msgSender();
        uint256 maxAssets = maxWithdraw(owner);

        if (assets > maxAssets) {
            revert ERC4626ExceededMaxWithdraw(owner, assets, maxAssets);
        }

        uint256 shares = previewWithdraw(ratioAdapter.toValue(asset(), assets));
        _claimYield();
        
        yieldBalance = getBalance();
        
        _withdraw(src, receiver, owner, assets, shares);

        return shares;
    }
    function claimYield() external nonReentrant whenNotPaused returns (uint256) {
        
        uint256 yield = _claimYield();
        yieldBalance = getBalance();
        return yield;
    }

    function _claimYield() internal virtual returns (uint256) {

        uint256 availableYields = getVaultYield();
        if (availableYields <= 0) return 0;

        IERC20(asset()).safeTransfer(yieldHeritor, ratioAdapter.fromValue(asset(), availableYields));

        emit Claim(address(this), yieldHeritor, availableYields);
        return availableYields;
    }


    // --- Admin ---
    function changeYieldHeritor(address _yieldHeritor) external onlyOwner {

        if (_yieldHeritor == address(0)) revert MetaLRTCoreZeroAddress();
        yieldHeritor = _yieldHeritor;

        emit YieldHeritor(yieldHeritor, _yieldHeritor);
    }
    function changeYieldMargin(uint256 _yieldMargin) external onlyOwner {

        if (_yieldMargin > MAX_YIELD_MARGIN) revert MetaLRTCoreMaxMargin();
        yieldMargin = _yieldMargin;

        emit YieldMargin(yieldMargin, _yieldMargin);
    }
    function changeAdapter(address adapter) external onlyOwner {

        if (adapter == address(0)) revert MetaLRTCoreZeroAddress();
        emit AdapterChanged(address(ratioAdapter), adapter);
        ratioAdapter = IRatioAdapter(adapter);
    }

    // --- Views ---
    function getVaultYield() public view virtual returns (uint256) {

        uint256 totalBalance = getBalance();
        if (totalBalance <= yieldBalance) return 0;

        uint256 diffBalance = totalBalance - yieldBalance;

        uint256 yield = diffBalance * yieldMargin / MAX_YIELD_MARGIN;

        return yield;
    }
    function getBalance() public view virtual returns (uint256) {

        return ratioAdapter.toValue(asset(), IERC20(asset()).balanceOf(address(this)));
    }
    function totalAssets() public view virtual override returns (uint256) {

        return getBalance() - getVaultYield();
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { Ownable2StepUpgradeable    } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { IAdaptorBase               } from "./interfaces/IAdaptorBase.sol";

import { IAdaptorController         } from "../interfaces/IAdaptorController.sol";
import { IPriceController           } from "../interfaces/IPriceController.sol";
import { SafeERC20, IERC20          } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";

// --- AdaptorBase ---
abstract contract AdaptorBase is ReentrancyGuardUpgradeable, Ownable2StepUpgradeable, IAdaptorBase {

    // --- Wrapper ---
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 public constant MAX = 1e18;

    // --- Vars ---
    address public asset;
    address public share;
    address public target;

    IAdaptorController public adaptorController;
    IPriceController public priceController;

    uint256 public yieldMargin;
    uint256 internal snapshot;

    // --- Mods ---
    modifier onlyAdaptorController {

        if (_msgSender() != address(adaptorController)) revert Adaptor_OnlyAdapterController();
        _;
    }

    // --- Init ---
    function __AdaptorBase_init(address _share, address _target, address _adaptorController, uint256 _yieldMargin) internal onlyInitializing {

        __ReentrancyGuard_init();
        __Ownable_init(_msgSender());

        asset = IAdaptorController(_adaptorController).asset();
        share = _share;
        target = _target;
        adaptorController = IAdaptorController(_adaptorController);
        priceController = IPriceController(IAdaptorController(_adaptorController).priceController());

        if (_yieldMargin > MAX) revert Adaptor_MaxMargin();
        yieldMargin = _yieldMargin;

        IERC20(share).approve(_adaptorController, type(uint256).max);
    }

    // --- NonViews ---
    function provide(uint256 _assets) external virtual override returns (uint256 _shares);
    function release(uint256 _assets, address _receiver) external virtual override returns (uint256 _actualAssets);
    function claim() public virtual override returns (uint256) {

        uint256 yield = previewYield();
        if (yield <= 0) return 0;

        address receiver = adaptorController.yieldHeritor();
        IERC20(share).safeTransfer(receiver, priceController.convertToShares(share, yield));
        snapshot = expand();

        emit Claim(_msgSender(), receiver, yield);
        return yield;
    }

    // --- Views ---
    function totalAssets() external view virtual override returns (uint256) {

        return expand() - previewYield();
    }
    function previewYield() public view virtual override returns (uint256) {

        uint256 newSnapshot = expand();
        uint256 oldSnapshot = snapshot;

        if (newSnapshot <= oldSnapshot) return 0;

        uint256 difference = newSnapshot - oldSnapshot;

        return (difference * yieldMargin) / MAX;
    }
    function expand() internal view virtual returns (uint256) {

        return priceController.convertToAssets(share, IERC20(share).balanceOf(address(this)));
    }
}
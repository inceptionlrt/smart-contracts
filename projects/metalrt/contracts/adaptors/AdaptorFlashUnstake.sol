// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AdaptorBase       } from "./AdaptorBase.sol";

import { SafeERC20, IERC20 } from "./AdaptorBase.sol";

// --- AdaptorFlashUnstake ---
contract AdaptorFlashUnstake is AdaptorBase {

    // --- Wrapper ---
    using SafeERC20 for IERC20;

    // --- Init ---
    function __AdaptorFlashUnstake_init() internal onlyInitializing {

    }
    function initialize(address _share, address _target, address _adaptorController, uint256 _yieldMargin) external virtual initializer {

        __AdaptorBase_init(_share, _target, _adaptorController, _yieldMargin);
        __AdaptorFlashUnstake_init();
    }

    // --- NonViews ---
    function provide(uint256 _assets) external virtual override nonReentrant returns (uint256 _shares) {

        claim();
        IERC20(asset).safeTransferFrom(address(adaptorController), address(this), _assets);

        emit Provided(_assets, 0);
    }
    function release(uint256 _assets, address _receiver) external virtual override nonReentrant onlyAdaptorController returns (uint256 _actualAssets) {

        claim();
        IERC20(asset).safeTransfer(_receiver, _assets);
        _actualAssets = _assets;

        emit Released(_assets, _assets, _receiver);
    }

    // --- NonViews ---
    function claim() public override returns (uint256) {

        uint256 yield = previewYield();
        if (yield <= 0) return 0;

        address receiver = adaptorController.yieldHeritor();
        IERC20(share).safeTransfer(receiver, yield);
        snapshot = expand();

        emit Claim(_msgSender(), receiver, yield);
        return yield;
    }

    // --- Views ---
    function totalAssets() external view override returns (uint256) {

        return IERC20(asset).balanceOf(address(this)) - previewYield();
    }
    function previewYield() public view override returns (uint256) {

        uint256 newSnapshot = expand();
        uint256 oldSnapshot = snapshot;

        if (newSnapshot <= oldSnapshot) return 0;

        uint256 difference = newSnapshot - oldSnapshot;

        return priceController.convertToShares(share, (difference * yieldMargin) / MAX);
    }
}
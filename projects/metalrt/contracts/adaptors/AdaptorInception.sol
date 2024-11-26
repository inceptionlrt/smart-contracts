// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AdaptorBase       } from "./AdaptorBase.sol";

import { IInception        } from "./interfaces/IInception.sol";
import { SafeERC20, IERC20 } from "./AdaptorBase.sol";

// --- AdaptorInception ---
contract AdaptorInception is AdaptorBase {

    // --- Wrapper ---
    using SafeERC20 for IERC20;

    // --- Init ---
    function __AdaptorInception_init() internal onlyInitializing {

    }
    function initialize(address _share, address _target, address _adaptorController, uint256 _yieldMargin) external virtual initializer {

        __AdaptorBase_init(_share, _target, _adaptorController, _yieldMargin);
        __AdaptorInception_init();
    }

    // --- NonViews ---
    function provide(uint256 _assets) external virtual override nonReentrant returns (uint256 _shares) {

        claim();

        IERC20(asset).safeTransferFrom(_msgSender(), address(this), _assets);
        _shares = IInception(target).deposit(_assets, address(this));

        emit Provided(_assets, _shares);
    }
    function release(uint256 _assets, address _receiver) external virtual override nonReentrant onlyAdaptorController returns (uint256 _actualAssets) {

        claim();

        address vault = adaptorController.vault();
        _actualAssets = IERC20(asset).balanceOf(vault);
        IInception(target).withdraw(_assets, vault, address(this));
        _actualAssets = IERC20(asset).balanceOf(vault) - _actualAssets;

        emit Released(_assets, _actualAssets, _receiver);
    }
}
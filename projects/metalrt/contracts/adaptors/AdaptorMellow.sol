// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AdaptorBase       } from "./AdaptorBase.sol";

import { IMellowWrapper    } from "./interfaces/IMellowWrapper.sol";
import { IMellowVault      } from "./interfaces/IMellowVault.sol";
import { SafeERC20, IERC20 } from "./AdaptorBase.sol";

// --- AdaptorMellow ---
contract AdaptorMellow is AdaptorBase {

    // --- Wrapper ---
    using SafeERC20 for IERC20;

    // --- Vars ---
    address public wrapper;
    uint256 public depositSlippage;
    uint256 public withdrawSlippage;
    uint256 public requestDeadline;
    bool public closePrevious;

    // --- Events ---
    event SlippagesSet(uint256 indexed _depositSlippage, uint256 indexed _withdrawSlippage);
    event DeadlineSet(uint256 indexed _deadline, bool indexed _closePrevious);

    // --- Errors ---
    error AdaptorMellow_InvalidSlippage();

    // --- Init ---
    function __AdaptorMellow_init(address _wrapper) internal onlyInitializing {

        wrapper = _wrapper;
    }
    function initialize(address _share, address _target, address _adaptorController, address _wrapper, uint256 _yieldMargin) external virtual initializer {

        __AdaptorBase_init(_share, _target, _adaptorController, _yieldMargin);
        __AdaptorMellow_init(_wrapper);

        depositSlippage = 1e16;
        withdrawSlippage = 1e16;
        requestDeadline = 15 days;

        emit SlippagesSet(depositSlippage, withdrawSlippage);
    }

    // --- NonViews ---
    function provide(uint256 _assets) external virtual override nonReentrant returns (uint256 _shares) {

        claim();

        IERC20(asset).safeTransferFrom(address(adaptorController), address(this), _assets);
        IERC20(asset).approve(wrapper, _assets);

        uint256 minAmount = _assets * (MAX - depositSlippage) / MAX;
        _shares = IMellowWrapper(wrapper).deposit(address(this), asset, _assets, minAmount, block.timestamp);

        emit Provided(_assets, _shares);
    }
    function release(uint256 _assets, address _receiver) external virtual override nonReentrant onlyAdaptorController returns (uint256 _actualAssets) {

        claim();

        uint256 lpAmount = 0; // todo
        uint256[] memory minAmounts = new uint256[](1);
        minAmounts[0] = _assets * (MAX - withdrawSlippage) / MAX;
        IMellowVault(target).registerWithdrawal(address(this), lpAmount, minAmounts, block.timestamp + 15 days, block.timestamp + requestDeadline, closePrevious);

        emit Released(_assets, 0, _receiver);
    }
    function setSlippages(uint256 _depositSlippage, uint256 _withdrawSlippage) external onlyOwner {

        if (_depositSlippage < 5e17 || _withdrawSlippage < 5e17) revert AdaptorMellow_InvalidSlippage();

        depositSlippage = _depositSlippage;
        withdrawSlippage = _withdrawSlippage;

        emit SlippagesSet(_depositSlippage, _withdrawSlippage);
    }
    function setRequestDealine(uint256 _deadline, bool _closePrevious) external onlyOwner {

        requestDeadline = _deadline;
        closePrevious = _closePrevious;

        emit DeadlineSet(_deadline, _closePrevious);
    }
}
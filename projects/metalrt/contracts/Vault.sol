// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { VaultAsyncRedeem   } from "./VaultAsyncRedeem.sol";
import { IVault             } from "./interfaces/IVault.sol";

import { SafeERC20, IERC20  } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { IAdaptorController } from "./interfaces/IAdaptorController.sol";

// --- Vault ---
contract Vault is VaultAsyncRedeem, IVault {

    // --- Wrappers ---
    using SafeERC20 for IERC20;

    // --- Vars ---
    address public adaptorController;
    address public delegator;

    // --- Mods ---
    modifier onlyDelegatorOrOwner {

        if (_msgSender() != owner() || _msgSender() != delegator) revert Vault_NotDelegator();
        _;
    }

    // --- Constructor ---
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    // --- Init ---
    function __Vault_init() internal onlyInitializing {

    }
    function initialize(string memory _name, string memory _symbol, address _asset) external virtual override initializer {

        __VaultAsyncRedeem_init(_name, _symbol, _asset);
        __Vault_init();
    }

    // --- NonViews ---
    function delegate() external onlyDelegatorOrOwner {

        uint256 assets = totalAssets();
        if (assets == 0) revert Vault_InvalidAmount();

        IERC20(asset()).approve(adaptorController, assets);
        IAdaptorController(adaptorController).requestDelegate(address(0), assets);

        emit Delegate(address(0), assets);
    }
    function delegate(address _adaptor, uint256 _assets) external onlyDelegatorOrOwner {

        if (_assets == 0) revert Vault_InvalidAmount();
        else if (_adaptor == address(0)) revert Vault_InvalidAddress();

        IERC20(asset()).approve(address(adaptorController), _assets);
        IAdaptorController(adaptorController).requestDelegate(_adaptor, _assets);

        emit Delegate(_adaptor, _assets);
    }
    function undelegate() external onlyDelegatorOrOwner {

        IAdaptorController(adaptorController).requestUndelegate(address(0), 0);

        emit Undelegate(address(0), type(uint256).max);
    }
    function undelegate(address _adaptor) external onlyDelegatorOrOwner {

        if (_adaptor == address(0)) revert Vault_InvalidAddress();
        IAdaptorController(adaptorController).requestUndelegate(_adaptor, 0);

        emit Undelegate(_adaptor, type(uint256).max);
    }
    function undelegate(uint256 _assets) external onlyDelegatorOrOwner {

        if (_assets == 0) revert Vault_InvalidAmount();
        IAdaptorController(adaptorController).requestUndelegate(address(0), _assets);

        emit Undelegate(address(0), _assets);
    }
    function undelegate(address _adaptor, uint256 _assets) external onlyDelegatorOrOwner {

        if (_assets == 0) revert Vault_InvalidAmount();
        else if (_adaptor == address(0)) revert Vault_InvalidAddress();

        IAdaptorController(adaptorController).requestUndelegate(_adaptor, _assets);

        emit Undelegate(_adaptor, _assets);
    }
    function claimYield() external {

        IAdaptorController(adaptorController).requestClaim(address(0));

        emit ClaimYield(address(0));
    }
    function claimYield(address _adaptor) external {

        IAdaptorController(adaptorController).requestClaim(_adaptor);

        emit ClaimYield(_adaptor);
    }
    function rebalance() external nonReentrant {
        // requestRebalance()
    }
    function setAdaptorController(address _adaptorController) external onlyOwner {

        if (_adaptorController == address(0)) revert Vault_InvalidAddress();

        address oldAdaptorController = adaptorController;
        adaptorController = _adaptorController;

        emit AdaptorControllerSet(oldAdaptorController, _adaptorController);
    }
    function setDelegator(address _delegator) external onlyOwner {

        if (_delegator == address(0)) revert Vault_InvalidAddress();

        address oldDelegator = delegator;
        delegator = _delegator;

        emit DelegatorSet(oldDelegator, _delegator);
    }
}
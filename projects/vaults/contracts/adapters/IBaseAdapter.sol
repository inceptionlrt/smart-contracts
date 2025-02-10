// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IIBaseAdapter} from "../interfaces/adapters/IIBaseAdapter.sol";

abstract contract IBaseAdapter is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    OwnableUpgradeable,
    IIBaseAdapter
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;
    address internal _trusteeManager;
    address internal _inceptionVault;

    modifier onlyTrustee() {
        require(
            msg.sender == _inceptionVault || msg.sender == _trusteeManager,
            NotVaultOrTrusteeManager()
        );
        _;
    }

    function __IBaseAdapter_init(IERC20 asset, address trusteeManager)
        public
        initializer
    {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        __ERC165_init();

        _asset = asset;
        _trusteeManager = trusteeManager;
    }

    function claimableAmount() external view virtual override returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    function setInceptionVault(address inceptionVault) external onlyOwner {
        emit VaultSet(_inceptionVault, inceptionVault);
        _inceptionVault = inceptionVault;
    }

    function setTrusteeManager(address _newTrusteeManager) external onlyOwner {
        emit TrusteeManagerSet(_trusteeManager, _newTrusteeManager);
        _trusteeManager = _newTrusteeManager;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getVersion() external pure virtual returns (uint256) {
        return 1;
    }
}

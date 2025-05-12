// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import {IBaseAdapter} from "../interfaces/adapters/IBaseAdapter.sol";

/**
 * @title InceptionBaseAdapter
 * @author The InceptionLRT team
 * @notice Base adapter for protocol integration
 * @dev Abstract contract implementing base functionality for all adapters
 * Includes asset management, security, and access control
 */
abstract contract InceptionBaseAdapter is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    OwnableUpgradeable,
    IBaseAdapter
{
    using SafeERC20 for IERC20;

    /// @notice Address of the asset token
    IERC20 internal _asset;
    /// @notice Address of the trustee manager
    address internal _trusteeManager;
    /// @notice Address of the Inception vault
    address internal _inceptionVault;

    /**
     * @notice Modifier to check if the caller is the vault or trustee manager
     * @dev Reverts if the caller is not authorized
     */
    modifier onlyTrustee() {
        require(
            msg.sender == _inceptionVault || msg.sender == _trusteeManager,
            NotVaultOrTrusteeManager()
        );
        _;
    }

    /**
     * @notice Initializes the base adapter
     * @dev Can only be called once
     * @param asset Address of the asset token
     * @param trusteeManager Address of the trustee manager
     */
    function __IBaseAdapter_init(
        IERC20 asset,
        address trusteeManager
    ) internal initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        __ERC165_init();

        _asset = asset;
        _trusteeManager = trusteeManager;
    }

    /**
     * @dev Returns the amount of tokens available for withdrawal
     * @return amount Amount of available tokens
     */
    function claimableAmount() public view virtual override returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    /**
     * @notice Sets the Inception vault address
     * @dev Can only be called by the owner
     * @param inceptionVault Address of the new vault
     */
    function setInceptionVault(address inceptionVault) external onlyOwner {
        if (!Address.isContract(inceptionVault)) revert NotContract();
        emit InceptionVaultSet(_inceptionVault, inceptionVault);
        _inceptionVault = inceptionVault;
    }

    /**
     * @notice Sets the trustee manager address
     * @dev Can only be called by the owner
     * @param _newTrusteeManager Address of the new trustee manager
     */
    function setTrusteeManager(address _newTrusteeManager) external onlyOwner {
        emit TrusteeManagerSet(_trusteeManager, _newTrusteeManager);
        _trusteeManager = _newTrusteeManager;
    }

    /**
     * @notice Pauses the contract
     * @dev Can only be called by the owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     * @dev Can only be called by the owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Returns the contract version
     * @return Contract version
     */
    function getVersion() external pure virtual returns (uint256) {
        return 1;
    }
}

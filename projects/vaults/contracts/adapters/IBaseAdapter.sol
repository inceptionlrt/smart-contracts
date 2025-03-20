// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import {IIBaseAdapter} from "../interfaces/adapters/IIBaseAdapter.sol";

/**
 * @title The IBaseAdapter Contract
 * @author The InceptionLRT team
 */
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

    /**
     * @notice Internal function to initialize the base adapter
     * @param asset The ERC20 token used as the underlying asset
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
     * @notice Returns the amount of tokens that can be claimed
     * @return Amount of claimable tokens for the adapter
     */
    function claimableAmount() public view virtual override returns (uint256) {
        return claimableAmount(address(this));
    }

    /**
     * @notice Returns the amount of tokens that can be claimed for a specific address
     * @param claimer Address to check claimable amount for
     * @return Amount of claimable tokens for the specified address
     */
    function claimableAmount(address claimer) public view virtual returns (uint256) {
        return _asset.balanceOf(claimer);
    }

    /**
     * @notice Sets the inception vault address
     * @dev Can only be called by owner
     * @param inceptionVault New inception vault address
     */
    function setInceptionVault(address inceptionVault) external onlyOwner {
        if (!Address.isContract(inceptionVault)) revert NotContract();
        emit InceptionVaultSet(_inceptionVault, inceptionVault);
        _inceptionVault = inceptionVault;
    }

    /**
     * @notice Sets the trustee manager address
     * @dev Can only be called by owner
     * @param _newTrusteeManager New trustee manager address
     */
    function setTrusteeManager(address _newTrusteeManager) external onlyOwner {
        emit TrusteeManagerSet(_trusteeManager, _newTrusteeManager);
        _trusteeManager = _newTrusteeManager;
    }

    /**
     * @notice Pauses the contract
     * @dev Can only be called by owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     * @dev Can only be called by owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Returns the contract version
     * @return Version number of the contract
     */
    function getVersion() external pure virtual returns (uint256) {
        return 1;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/adapters/IMellowAdapter.sol";
import "./InceptionBaseAdapter.sol";
import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";

import {IClaimer} from "../interfaces/symbiotic-vault/mellow-core/IClaimer.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {IMellowDepositWrapper} from "../interfaces/symbiotic-vault/mellow-core/IMellowDepositWrapper.sol";
import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";
import {IMellowVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowVault.sol";

import {IMultiVaultStorage} from "../interfaces/symbiotic-vault/mellow-core/IMultiVaultStorage.sol";
import {IWithdrawalQueue} from "../interfaces/symbiotic-vault/mellow-core/IWithdrawalQueue.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title The InceptionMellowAdapterV3 Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the Mellow protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract InceptionMellowAdapterV3 is IMellowAdapter, InceptionBaseAdapter {
    using SafeERC20 for IERC20;

    /// @notice Array of Mellow vaults managed by this adapter
    IMellowVault[] public vaults;

    /// @notice Mapping of vault addresses to their allocation weights
    mapping(address => uint256) public allocations;

    /// @notice Total sum of all vault allocations
    uint256 public totalAllocations;

    /// @notice Address of the claimer contract
    address public claimer;

    /// @notice Address of the withdrawal queue contract
    address public withdrawalQueue;

    /**
     * @dev Constructor with initializer disabled to prevent initialization during deployment
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor() payable {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with Mellow vaults, asset, and trustee manager
     * @param _mellowVaults Array of Mellow vault addresses to initialize
     * @param asset The ERC20 asset token used by the adapter
     * @param trusteeManager Address of the trustee manager
     */
    function initialize(
        IMellowVault[] memory _mellowVaults,
        IERC20 asset,
        address trusteeManager
    ) public initializer {
        __IBaseAdapter_init(asset, trusteeManager);

        uint256 totalAllocations_;
        for (uint256 i = 0; i < _mellowVaults.length; i++) {
            for (uint8 j = 0; j < i; j++)
                if (address(_mellowVaults[i]) == address(_mellowVaults[j])) revert AlreadyAdded();
            vaults.push(_mellowVaults[i]);
            allocations[address(_mellowVaults[i])] = 1;
            totalAllocations_ += 1;
        }

        totalAllocations = totalAllocations_;
    }

    /**
     * @notice Delegates assets to a specified vault or automatically across vaults
     * @param vault The target vault address for delegation
     * @param amount The amount of assets to delegate
     * @param _data Encoded data to determine delegation type (manual or auto)
     * @return depositedAmount The amount of assets successfully deposited
     */
    function delegate(
        address vault,
        uint256 amount,
        bytes[] calldata _data
    )
    external
    override
    onlyTrustee
    whenNotPaused
    returns (uint256 depositedAmount)
    {
        bool delegateAuto = abi.decode(_data[0], (bool));

        if (!delegateAuto) return _delegate(vault, amount);
        else return _delegateAuto(amount);
    }

    /**
     * @dev Internal function to delegate assets to a specific vault
     * @param vault The target vault address
     * @param amount The amount of assets to delegate
     * @return depositedAmount The amount of assets deposited as LP tokens
     */
    function _delegate(
        address vault,
        uint256 amount
    ) internal returns (uint256 depositedAmount) {
        bool exists;
        for (uint8 i = 0; i < vaults.length; i++) {
            if (vault == address(vaults[i])) {
                exists = true;
                break;
            }
        }

        if (!exists) revert NotAdded();

        _asset.safeTransferFrom(msg.sender, address(this), amount);
        IERC20(_asset).safeIncreaseAllowance(address(vault), amount);

        uint256 lpAmount = IERC4626(vault).deposit(amount, address(this));

        depositedAmount = lpAmountToAmount(lpAmount, IMellowVault(vault));
    }

    /**
     * @dev Internal function to automatically delegate assets across vaults based on allocations
     * @param amount The total amount of assets to delegate
     * @return depositedAmount The total amount of assets deposited as LP tokens
     */
    function _delegateAuto(
        uint256 amount
    ) internal returns (uint256 depositedAmount) {
        uint256 allocationsTotal = totalAllocations;
        _asset.safeTransferFrom(msg.sender, address(this), amount);

        for (uint8 i = 0; i < vaults.length; i++) {
            uint256 allocation = allocations[address(vaults[i])];
            if (allocation > 0) {
                uint256 localBalance = (amount * allocation) / allocationsTotal;
                IERC20(_asset).safeIncreaseAllowance(address(vaults[i]), localBalance);
                uint256 lpAmount = IERC4626(address(vaults[i])).deposit(
                    localBalance,
                    address(this)
                );

                depositedAmount += lpAmountToAmount(lpAmount, vaults[i]);
            }
        }

        uint256 left = _asset.balanceOf(address(this));
        if (left != 0) _asset.safeTransfer(_inceptionVault, left);
    }

    /**
     * @notice Withdraws assets from a specified vault
     * @param vault The target vault address
     * @param amount The amount of assets to withdraw
     * @return The amount of assets withdrawn
     */
    function withdraw(
        address vault,
        uint256 amount,
        bytes[] calldata /*_data */
    ) external onlyTrustee whenNotPaused returns (uint256) {
        uint256 balanceState = _asset.balanceOf(address(this));
        IERC4626(vault).withdraw(amount, address(this), address(this));

        return (_asset.balanceOf(address(this)) - balanceState);
    }

    /**
     * @notice Claims pending assets from vaults
     * @return amount The amount of assets claimed
     */
    function claim(
        bytes[] calldata /*_data */
    ) external onlyTrustee whenNotPaused returns (uint256) {
        _claimPending();
        uint256 amount = _asset.balanceOf(address(this));
        if (amount == 0) revert ValueZero();

        _asset.safeTransfer(_inceptionVault, amount);

        return amount;
    }

    /**
     * @dev Internal function to claim pending assets from all vaults
     */
    function _claimPending() private {
        for (uint256 i = 0; i < vaults.length; i++) {
            uint256 amount;
            uint256 numbers;
            uint256 length = IMultiVaultStorage(address(vaults[i]))
                .subvaultsCount();

            uint256[] memory claimableArray = new uint256[](length);
            uint256[] memory subvaultIndices;
            uint256[][] memory indices;

            for (uint256 j = 0; j < length; j++) {
                claimableArray[j] = IWithdrawalQueue(
                    IMultiVaultStorage(address(vaults[i]))
                    .subvaultAt(j)
                    .withdrawalQueue
                ).claimableAssetsOf(address(this));

                if (claimableArray[j] != 0) {
                    amount += claimableArray[j];
                    numbers++;
                }
            }

            if (numbers != 0) {
                subvaultIndices = new uint256[](numbers);
                uint256 l;
                for (uint256 k = 0; k < length; k++) {
                    if (claimableArray[k] != 0) {
                        subvaultIndices[l++] = k;
                    }
                }
            }

            IClaimer(claimer).multiAcceptAndClaim(
                address(vaults[i]),
                subvaultIndices,
                indices,
                address(this),
                amount
            );
        }
    }

    /**
     * @notice Adds a new Mellow vault to the adapter
     * @param mellowVault The address of the Mellow vault to add
     */
    function addMellowVault(address mellowVault) external onlyOwner {
        if (mellowVault == address(0)) revert ZeroAddress();

        for (uint8 i = 0; i < vaults.length; i++) {
            if (mellowVault == address(vaults[i])) revert AlreadyAdded();
        }

        vaults.push(IMellowVault(mellowVault));

        emit VaultAdded(mellowVault);
    }

    /**
     * @notice Updates the allocation weight for a Mellow vault
     * @param mellowVault The address of the Mellow vault
     * @param newAllocation The new allocation weight
     */
    function changeAllocation(
        address mellowVault,
        uint256 newAllocation
    ) external onlyOwner {
        if (mellowVault == address(0)) revert ZeroAddress();

        bool exists;
        for (uint8 i = 0; i < vaults.length; i++) {
            if (mellowVault == address(vaults[i])) exists = true;
        }
        if (!exists) revert InvalidVault();
        uint256 oldAllocation = allocations[mellowVault];
        allocations[mellowVault] = newAllocation;

        totalAllocations = totalAllocations + newAllocation - oldAllocation;

        emit AllocationChanged(mellowVault, oldAllocation, newAllocation);
    }

    /**
     * @notice Returns the total claimable withdrawal amount across all vaults
     * @return total The total claimable assets
     */
    function claimableWithdrawalAmount() public view returns (uint256 total) {
        uint256 length;

        for (uint256 i = 0; i < vaults.length; i++) {
            length = IMultiVaultStorage(address(vaults[i])).subvaultsCount();

            for (uint256 j = 0; j < length; j++) {
                IMultiVaultStorage.Subvault
                memory subvault = IMultiVaultStorage(address(vaults[i]))
                    .subvaultAt(j);
                total += IWithdrawalQueue(subvault.withdrawalQueue)
                    .claimableAssetsOf(address(this));
            }
        }
    }

    /**
     * @notice Returns the claimable withdrawal amount for a specific vault
     * @param _mellowVault The address of the Mellow vault
     * @return assets The claimable assets for the vault
     */
    function claimableWithdrawalAmount(
        address _mellowVault
    ) external view returns (uint256 assets) {
        uint256 length = IMultiVaultStorage(_mellowVault).subvaultsCount();

        for (uint256 i = 0; i < length; i++) {
            IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(
                _mellowVault
            ).subvaultAt(i);
            assets += IWithdrawalQueue(subvault.withdrawalQueue)
                .claimableAssetsOf(address(this));
        }
    }

    /**
     * @notice Returns the total pending withdrawal amount across all vaults
     * @return total The total pending assets
     */
    function pendingWithdrawalAmount() public view returns (uint256 total) {
        uint256 length;

        for (uint256 i = 0; i < vaults.length; i++) {
            length = IMultiVaultStorage(address(vaults[i])).subvaultsCount();

            for (uint256 j = 0; j < length; j++) {
                IMultiVaultStorage.Subvault
                memory subvault = IMultiVaultStorage(address(vaults[i]))
                    .subvaultAt(j);
                total += IWithdrawalQueue(subvault.withdrawalQueue)
                    .pendingAssetsOf(address(this));
            }
        }
    }

    /**
     * @notice Returns the pending withdrawal amount for a specific vault
     * @param _mellowVault The address of the Mellow vault
     * @return assets The pending assets for the vault
     */
    function pendingWithdrawalAmount(
        address _mellowVault
    ) external view returns (uint256 assets) {
        uint256 length = IMultiVaultStorage(_mellowVault).subvaultsCount();

        for (uint256 i = 0; i < length; i++) {
            IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(
                _mellowVault
            ).subvaultAt(i);
            assets += IWithdrawalQueue(subvault.withdrawalQueue)
                .pendingAssetsOf(address(this));
        }
    }

    /**
     * @notice Returns the total deposited assets in a specific vault
     * @param _mellowVault The address of the Mellow vault
     * @return The total deposited assets
     */
    function getDeposited(
        address _mellowVault
    ) public view override returns (uint256) {
        IMellowVault mellowVault = IMellowVault(_mellowVault);
        uint256 balance = mellowVault.balanceOf(address(this));
        if (balance == 0) return 0;

        return IERC4626(address(mellowVault)).previewRedeem(balance);
    }

    /**
     * @notice Returns the total deposited assets across all vaults
     * @return The total deposited assets
     */
    function getTotalDeposited() public view override returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < vaults.length; i++) {
            uint256 balance = vaults[i].balanceOf(address(this));
            if (balance > 0)
                total += IERC4626(address(vaults[i])).previewRedeem(balance);
        }
        return total;
    }

    /**
     * @notice Returns the total inactive balance (pending, claimable, and claimable withdrawals)
     * @return The total inactive balance
     */
    function inactiveBalance() public view returns (uint256) {
        return
            pendingWithdrawalAmount() +
            claimableWithdrawalAmount() +
            claimableAmount();
    }

    /**
     * @notice Converts an asset amount to LP token amount for a vault
     * @param amount The amount of assets
     * @param mellowVault The Mellow vault interface
     * @return lpAmount The equivalent LP token amount
     */
    function amountToLpAmount(
        uint256 amount,
        IMellowVault mellowVault
    ) public view returns (uint256 lpAmount) {
        return IERC4626(address(mellowVault)).convertToShares(amount);
    }

    /**
     * @notice Converts an LP token amount to asset amount for a vault
     * @param lpAmount The amount of LP tokens
     * @param mellowVault The Mellow vault interface
     * @return The equivalent asset amount
     */
    function lpAmountToAmount(
        uint256 lpAmount,
        IMellowVault mellowVault
    ) public view returns (uint256) {
        return IERC4626(address(mellowVault)).convertToAssets(lpAmount);
    }

    /**
     * @notice Sets a new claimer address
     * @param newClaimer The new claimer address
     */
    function setClaimer(address newClaimer) external onlyOwner {
        if (newClaimer == address(0)) revert ZeroAddress();

        emit ClaimerChanged(claimer, newClaimer);
        claimer = newClaimer;
    }

    /**
     * @notice Returns the version of the adapter
     * @return The version number (3)
     */
    function getVersion() external pure override returns (uint256) {
        return 3;
    }
}
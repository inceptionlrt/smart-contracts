// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IInceptionSymbioticAdapter} from "../interfaces/adapters/IInceptionSymbioticAdapter.sol";
import {IVault} from "../interfaces/symbiotic-vault/symbiotic-core/IVault.sol";
import {IStakerRewards} from "../interfaces/symbiotic-vault/symbiotic-core/IStakerRewards.sol";

import {InceptionBaseAdapter, IInceptionBaseAdapter} from "./InceptionBaseAdapter.sol";
import {SymbioticAdapterClaimer} from "../adapter-claimers/SymbioticAdapterClaimer.sol";

/**
 * @title The InceptionSymbioticAdapter.sol Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the SymbioticFi Protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract InceptionSymbioticAdapter is IInceptionSymbioticAdapter, InceptionBaseAdapter {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @notice Set of supported Symbiotic vaults
    EnumerableSet.AddressSet internal _symbioticVaults;

    /// @notice Mapping of vault addresses to their withdrawal epochs
    mapping(address => mapping(address => uint256)) public withdrawals;
    mapping(address => address) internal claimerVaults;

    address internal _emergencyClaimer;
    EnumerableSet.AddressSet internal pendingClaimers;
    address[] internal availableClaimers;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    /**
     * @notice Initializes the Symbiotic adapter with vaults and parameters
     * @param vaults Array of vault addresses
     * @param asset Address of the underlying asset
     * @param trusteeManager Address of the trustee manager
     */
    function initialize(
        address[] memory vaults,
        IERC20 asset,
        address trusteeManager
    ) public initializer {
        __InceptionBaseAdapter_init(asset, trusteeManager);

        for (uint256 i = 0; i < vaults.length; i++) {
            if (IVault(vaults[i]).collateral() != address(asset))
                revert InvalidCollateral();
            if (!_symbioticVaults.add(vaults[i])) revert AlreadyAdded();
            emit VaultAdded(vaults[i]);
        }
    }

    /**
     * @notice Delegates funds to a Symbiotic vault
     * @dev Can only be called by trustee when contract is not paused
     * @param vaultAddress Address of the target Symbiotic vault
     * @param amount Amount of tokens to delegate
     */
    function delegate(
        address vaultAddress,
        uint256 amount,
        bytes[] calldata /* _data */
    )
    external
    override
    onlyTrustee
    whenNotPaused
    returns (uint256 depositedAmount)
    {
        require(_symbioticVaults.contains(vaultAddress), InvalidVault());
        _asset.safeTransferFrom(msg.sender, address(this), amount);
        IERC20(_asset).safeIncreaseAllowance(vaultAddress, amount);

        uint256 mintedShares;
        (depositedAmount, mintedShares) = IVault(vaultAddress).deposit(
            address(this),
            amount
        );

        emit MintedShares(mintedShares);
        return depositedAmount;
    }

    /**
     * @notice Initiates withdrawal from a Symbiotic vault
     * @dev Can only be called by trustee when contract is not paused
     * @param vaultAddress Address of the vault to withdraw from
     * @param amount Amount to withdraw
     * @param emergency Flag for emergency withdrawal
     * @return Tuple of (amount requested, 0)
     */
    function withdraw(
        address vaultAddress,
        uint256 amount,
        bytes[] calldata /* _data */ ,
        bool emergency
    ) external onlyTrustee whenNotPaused returns (uint256, uint256) {
        IVault vault = IVault(vaultAddress);
        require(_symbioticVaults.contains(vaultAddress), InvalidVault());

        address claimer = _getOrCreateClaimer(emergency);
        require(withdrawals[vaultAddress][claimer] == 0, WithdrawalInProgress());

        (uint256 burnedShares, uint256 mintedShares) = vault.withdraw(claimer, amount);
        withdrawals[vaultAddress][claimer] = vault.currentEpoch() + 1;
        claimerVaults[claimer] = vaultAddress;

        emit SymbioticWithdrawn(burnedShares, mintedShares, claimer);

        return (amount, 0);
    }

    /**
     * @notice Claims withdrawn funds from a Symbiotic vault
     * @dev Can only be called by trustee when contract is not paused
     * @param _data Array containing vault address and epoch number
     * @param emergency Flag for emergency claim process
     * @return Amount of tokens claimed
     */
    function claim(
        bytes[] calldata _data,
        bool emergency
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        if (_data.length > 1) revert InvalidDataLength(1, _data.length);
        (address vaultAddress, address claimer) = abi.decode(_data[0], (address, address));
        if (!_symbioticVaults.contains(vaultAddress)) revert InvalidVault();
        if (emergency && _emergencyClaimer != claimer) revert OnlyEmergency();
        if (withdrawals[vaultAddress][claimer] == 0) revert NothingToClaim();

        uint256 epoch = withdrawals[vaultAddress][claimer];
        delete withdrawals[vaultAddress][claimer];
        if (!emergency) {
            _removePendingClaimer(claimer);
        }

        return SymbioticAdapterClaimer(claimer).claim(
            vaultAddress, _inceptionVault, epoch
        );
    }

    /**
     * @notice Claim rewards from Symbiotic protocol.
     * @dev Can only be called by trustee
     * @param rewardToken Reward token.
     * @param rewardsData Adapter related bytes of data for rewards.
     */
    function claimRewards(address rewardToken, bytes memory rewardsData) external onlyTrustee {
        (address symbioticFarm, bytes memory farmData) = abi.decode(rewardsData, (address, bytes));
        IStakerRewards(symbioticFarm).claimRewards(_inceptionVault, rewardToken, farmData);
    }

    /**
     * @notice Checks if a vault is supported by the adapter
     * @param vaultAddress Address of the vault to check
     * @return bool indicating if vault is supported
     */
    function isVaultSupported(
        address vaultAddress
    ) external view returns (bool) {
        return _symbioticVaults.contains(vaultAddress);
    }

    /**
     * @notice Returns the amount deposited in a specific vault
     * @param vaultAddress Address of the vault to check
     * @return Amount of active balance in the vault
     */
    function getDeposited(
        address vaultAddress
    ) public view override returns (uint256) {
        return IVault(vaultAddress).activeBalanceOf(address(this));
    }

    /**
     * @notice Returns the total amount deposited across all vaults
     * @return total Sum of active balances in all vaults
     */
    function getTotalDeposited() public view override returns (uint256 total) {
        for (uint256 i = 0; i < _symbioticVaults.length(); i++)
            total += IVault(_symbioticVaults.at(i)).activeBalanceOf(
                address(this)
            );

        return total;
    }

    /**
     * @notice Returns the total amount pending withdrawal
     * @return total Amount of pending withdrawals for non-emergency claims
     */
    function pendingWithdrawalAmount() public view override returns (uint256 total)
    {
        return _pendingWithdrawalAmount(false);
    }

    /**
     * @notice Internal function to calculate pending withdrawal amount for an address
     * @param emergency Emergency flag for claimer
     * @return total Total pending withdrawal amount
     */
    function _pendingWithdrawalAmount(bool emergency) internal view returns (uint256 total)
    {
        if (emergency) {
            for (uint256 i = 0; i < _symbioticVaults.length(); i++) {
                if (withdrawals[_symbioticVaults.at(i)][_emergencyClaimer] != 0) {
                    total += IVault(_symbioticVaults.at(i)).withdrawalsOf(
                        withdrawals[_symbioticVaults.at(i)][_emergencyClaimer],
                        _emergencyClaimer
                    );
                }
            }

            return total;
        }

        for (uint256 i = 0; i < pendingClaimers.length(); i++) {
            address _claimer = pendingClaimers.at(i);
            address _vault = claimerVaults[_claimer];
            total += IVault(_vault).withdrawalsOf(withdrawals[_vault][_claimer], _claimer);
        }

        return total;
    }

    /**
     * @notice Returns the total inactive balance
     * @return Pending withdrawals
     */
    function inactiveBalance() public view override returns (uint256) {
        return pendingWithdrawalAmount();
    }

    /**
     * @notice Returns the total inactive balance for emergency situations
     * @return Sum of emergency pending withdrawals and claimable amounts
     */
    function inactiveBalanceEmergency() public view override returns (uint256) {
        return _pendingWithdrawalAmount(true);
    }

    /**
     * @notice Adds a new vault to the adapter
     * @param vaultAddress Address of the new vault
     */
    function addVault(address vaultAddress) external onlyOwner {
        if (vaultAddress == address(0)) revert ZeroAddress();
        if (!Address.isContract(vaultAddress)) revert NotContract();

        if (_symbioticVaults.contains(vaultAddress)) revert AlreadyAdded();
        if (IVault(vaultAddress).collateral() != address(_asset))
            revert InvalidCollateral();

        _symbioticVaults.add(vaultAddress);

        emit VaultAdded(vaultAddress);
    }

    /**
     * @notice Removes a vault from the adapter
     * @param vaultAddress Address of the vault to remove
     */
    function removeVault(address vaultAddress) external onlyOwner {
        if (vaultAddress == address(0)) revert ZeroAddress();
        if (!Address.isContract(vaultAddress)) revert NotContract();
        if (!_symbioticVaults.contains(vaultAddress)) revert NotAdded();
        if (getDeposited(vaultAddress) != 0) revert VaultNotEmpty();

        _symbioticVaults.remove(vaultAddress);

        emit VaultRemoved(vaultAddress);
    }

    /**
     * @notice Returns all supported vault addresses
     * @return vaults Array of supported vault addresses
     */
    function getAllVaults() external view returns (address[] memory vaults) {
        vaults = new address[](_symbioticVaults.length());
        for (uint256 i = 0; i < _symbioticVaults.length(); i++)
            vaults[i] = _symbioticVaults.at(i);
    }

    /*
    * @notice Retrieves or creates a claimer address based on the emergency condition
    * @dev If `emergency` is true, returns the existing emergency claimer or deploys a new one if it doesn't exist.
    *      If `emergency` is false, reuses an available claimer from the `availableClaimers` array or deploys a new one.
    *      The returned claimer is added to the `pendingClaimers` set
    * @param emergency Boolean indicating whether an emergency claimer is required
    * @return claimer The address of the claimer to be used
    */
    function _getOrCreateClaimer(bool emergency) internal virtual returns (address claimer) {
        if (emergency) {
            return _emergencyClaimer != address(0) ? _emergencyClaimer : (_emergencyClaimer = _deployClaimer());
        }

        if (availableClaimers.length > 0) {
            claimer = availableClaimers[availableClaimers.length - 1];
            availableClaimers.pop();
        } else {
            claimer = _deployClaimer();
        }

        pendingClaimers.add(claimer);
        return claimer;
    }

    /*
    * @notice Removes a claimer from the pending list and recycles it to the available claimers
    * @dev Deletes the claimer's vault mapping, removes it from `pendingClaimers`, and adds it to `availableClaimers`
    * @param claimer The address of the claimer to be removed from pending status
    */
    function _removePendingClaimer(address claimer) internal {
        delete claimerVaults[claimer];
        pendingClaimers.remove(claimer);
        availableClaimers.push(claimer);
    }

    /*
    * @notice Deploys a new SymbioticAdapterClaimer contract instance
    * @dev Creates a new claimer contract with the `_asset` address passed as a constructor parameter
    * @return The address of the newly deployed SymbioticAdapterClaimer contract
    */
    function _deployClaimer() internal returns (address) {
        return address(new SymbioticAdapterClaimer(address(_asset)));
    }
}

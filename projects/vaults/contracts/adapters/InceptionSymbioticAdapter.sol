// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {ISymbioticAdapter} from "../interfaces/adapters/ISymbioticAdapter.sol";
import {IVault} from "../interfaces/symbiotic-vault/symbiotic-core/IVault.sol";
import {IStakerRewards} from "../interfaces/symbiotic-vault/symbiotic-core/IStakerRewards.sol";

import {InceptionBaseAdapter, IBaseAdapter} from "./InceptionBaseAdapter.sol";

/**
 * @title The ISymbioticAdapter Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the SymbioticFi Protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract InceptionSymbioticAdapter is ISymbioticAdapter, InceptionBaseAdapter {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet internal _symbioticVaults;

    /// @dev symbioticVault => withdrawal epoch
    mapping(address => uint256) public withdrawals;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        address[] memory vaults,
        IERC20 asset,
        address trusteeManager
    ) public initializer {
        __IBaseAdapter_init(asset, trusteeManager);

        for (uint256 i = 0; i < vaults.length; i++) {
            if (IVault(vaults[i]).collateral() != address(asset))
                revert InvalidCollateral();
            if (!_symbioticVaults.add(vaults[i])) revert AlreadyAdded();
            emit VaultAdded(vaults[i]);
        }
    }

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

    function withdraw(
        address vaultAddress,
        uint256 amount,
        bytes[] calldata /*_data */
    ) external onlyTrustee whenNotPaused returns (uint256) {
        IVault vault = IVault(vaultAddress);
        if (!_symbioticVaults.contains(vaultAddress)) revert InvalidVault();
        if (
            withdrawals[vaultAddress] != vault.currentEpoch() + 1 &&
            withdrawals[vaultAddress] > 0
        ) revert WithdrawalInProgress();

        uint256 burnedShares;
        uint256 mintedShares;
        (burnedShares, mintedShares) = vault.withdraw(address(this), amount);

        uint256 epoch = vault.currentEpoch() + 1;
        withdrawals[vaultAddress] = epoch;

        emit BurnedAndMintedShares(burnedShares, mintedShares);

        return amount;
    }

    function claim(
        bytes[] calldata _data
    ) external override onlyTrustee whenNotPaused returns (uint256) {

        if (_data.length > 1) revert InvalidDataLength(1, _data.length);

        (address vaultAddress, uint256 sEpoch) = abi.decode(
            _data[0],
            (address, uint256)
        );

        if (!_symbioticVaults.contains(vaultAddress)) revert InvalidVault();
        if (withdrawals[vaultAddress] == 0) revert NothingToClaim();
        if (sEpoch >= IVault(vaultAddress).currentEpoch()) revert InvalidEpoch();
        if (sEpoch != withdrawals[vaultAddress]) revert WrongEpoch();

        delete withdrawals[vaultAddress];
        return IVault(vaultAddress).claim(_inceptionVault, sEpoch);
    }

    /**
     * @notice Checks whether a vault is supported by the Protocol or not.
     * @param vaultAddress vault address to check
     */
    function isVaultSupported(
        address vaultAddress
    ) external view returns (bool) {
        return _symbioticVaults.contains(vaultAddress);
    }

    function getDeposited(
        address vaultAddress
    ) public view override returns (uint256) {
        return IVault(vaultAddress).activeBalanceOf(address(this));
    }

    function getTotalDeposited() public view override returns (uint256 total) {
        for (uint256 i = 0; i < _symbioticVaults.length(); i++)
            total += IVault(_symbioticVaults.at(i)).activeBalanceOf(
                address(this)
            );

        return total;
    }

    function pendingWithdrawalAmount()
        public
        view
        override
        returns (uint256 total)
    {
        for (uint256 i = 0; i < _symbioticVaults.length(); i++)
            if (withdrawals[_symbioticVaults.at(i)] != 0)
                total += IVault(_symbioticVaults.at(i)).withdrawalsOf(
                    withdrawals[_symbioticVaults.at(i)],
                    address(this)
                );

        return total;
    }

    function inactiveBalance() public view override returns (uint256) {
        return pendingWithdrawalAmount() + claimableAmount();
    }

    function addVault(address vaultAddress) external onlyOwner {
        if (vaultAddress == address(0)) revert ZeroAddress();
        if (!Address.isContract(vaultAddress)) revert NotContract();

        if (_symbioticVaults.contains(vaultAddress)) revert AlreadyAdded();
        if (IVault(vaultAddress).collateral() != address(_asset))
            revert InvalidCollateral();

        _symbioticVaults.add(vaultAddress);

        emit VaultAdded(vaultAddress);
    }

    function removeVault(address vaultAddress) external onlyOwner {
        if (vaultAddress == address(0)) revert ZeroAddress();
        if (!_symbioticVaults.contains(vaultAddress)) revert NotAdded();

        _symbioticVaults.remove(vaultAddress);

        emit VaultRemoved(vaultAddress);
    }
}

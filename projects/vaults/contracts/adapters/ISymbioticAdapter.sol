// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IISymbioticAdapter} from "../interfaces/adapters/IISymbioticAdapter.sol";
import {IVault} from "../interfaces/symbiotic-vault/symbiotic-core/IVault.sol";
import {IStakerRewards} from "../interfaces/symbiotic-vault/symbiotic-core/IStakerRewards.sol";

import {IBaseAdapter, IIBaseAdapter} from "./IBaseAdapter.sol";

/**
 * @title The ISymbioticAdapter Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the SymbioticFi Protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract ISymbioticAdapter is IISymbioticAdapter, IBaseAdapter {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet internal _vaults;

    /// @dev symbioticVault => withdrawal epoch
    mapping(address => uint256) public withdrawals;

    // /// @dev Symbiotic DefaultStakerRewards.sol
    // IStakerRewards public stakerRewards;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        address[] memory vaults,
        IERC20 asset,
        address trusteeManager
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        __ERC165_init();
        __IBaseAdapter_init(asset, trusteeManager);

        for (uint256 i = 0; i < vaults.length; i++) {
            _vaults.add(vaults[i]);
            emit VaultAdded(vaults[i]);
        }
    }

    function delegate(
        address vaultAddress,
        uint256 amount,
        bytes[] calldata _data
    )
        external
        override
        onlyTrustee
        whenNotPaused
        returns (uint256 depositedAmount)
    {
        require(_vaults.contains(vaultAddress), InvalidVault());
        _asset.safeTransferFrom(_inceptionVault, address(this), amount);
        IERC20(_asset).safeIncreaseAllowance(vaultAddress, amount);
        (depositedAmount, ) = IVault(vaultAddress).deposit(
            address(this),
            amount
        );
        return depositedAmount;
    }

    function withdraw(
        address vaultAddress,
        uint256 amount,
        bytes[] calldata _data
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        require(_vaults.contains(vaultAddress), InvalidVault());
        require(withdrawals[vaultAddress] == 0, WithdrawalInProgress());

        IVault vault = IVault(vaultAddress);
        (, uint256 mintedShares) = vault.withdraw(address(this), amount);
        withdrawals[vaultAddress] = vault.currentEpoch() + 1;

        return mintedShares;
    }

    function claim(
        bytes[] calldata _data
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        (address vaultAddress, uint256 sEpoch) = abi.decode(
            _data[0],
            (address, uint256)
        );
        require(_vaults.contains(vaultAddress), InvalidVault());
        require(withdrawals[vaultAddress] != 0, NothingToClaim());

        delete withdrawals[vaultAddress];
        return IVault(vaultAddress).claim(_inceptionVault, sEpoch);
    }

    // /// TODO
    // function pendingRewards() external view returns (uint256) {
    //     return stakerRewards.claimable(address(_asset), address(this), "");
    // }

    /**
     * @notice Checks whether a vault is supported by the Protocol or not.
     * @param vaultAddress vault address to check
     */
    function isVaultSupported(
        address vaultAddress
    ) external view returns (bool) {
        return _vaults.contains(vaultAddress);
    }

    function getDeposited(
        address vaultAddress
    ) public view override returns (uint256) {
        return IVault(vaultAddress).activeBalanceOf(address(this));
    }

    function getTotalDeposited() public view override returns (uint256 total) {
        for (uint256 i = 0; i < _vaults.length(); i++)
            total += IVault(_vaults.at(i)).activeBalanceOf(address(this));

        return total;
    }

    function pendingWithdrawalAmount()
        public
        view
        override
        returns (uint256 total)
    {
        for (uint256 i = 0; i < _vaults.length(); i++)
            if (withdrawals[_vaults.at(i)] != 0)
                total += IVault(_vaults.at(i)).withdrawalsOf(
                    withdrawals[_vaults.at(i)],
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

        if (_vaults.contains(vaultAddress)) revert AlreadyAdded();

        _vaults.add(vaultAddress);

        emit VaultAdded(vaultAddress);
    }
}

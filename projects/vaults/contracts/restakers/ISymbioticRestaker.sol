// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IISymbioticRestaker, IIEigenRestakerErrors} from "../interfaces/symbiotic-vault/IISymbioticRestaker.sol";
import {IVault} from "../interfaces/symbiotic-vault/symbiotic-core/IVault.sol";
import {IStakerRewards} from "../interfaces/symbiotic-vault/symbiotic-core/IStakerRewards.sol";

/**
 * @title The SymbioticRestaker Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the SymbioticFi Protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
abstract contract ISymbioticRestaker is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    OwnableUpgradeable,
    IISymbioticRestaker,
    IIEigenRestakerErrors
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;
    address internal _trusteeManager;
    address internal _vault;

    /// @dev Symbiotic DefaultStakerRewards.sol
    IStakerRewards public stakerRewards;

    IVault[] public vaults;

    mapping(address => IVault) public deposits; // symbioticVaukt => mellowDepositWrapper
    /// @dev symbioticVault => withdrawal epoch
    mapping(address => uint256) public withdrawals;

    mapping(address => uint256) public allocations;
    uint256 public totalAllocations;

    modifier onlyTrustee() {
        if (msg.sender != _vault && msg.sender != _trusteeManager)
            revert NotVaultOrTrusteeManager();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        IVault[] memory vault,
        IERC20 asset,
        address trusteeManager
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        __ERC165_init();

        // for (uint256 i = 0; i < _mellowDepositWrapper.length; i++) {
        //     if (
        //         address(_mellowDepositWrapper[i].vault()) !=
        //         address(_mellowVault[i])
        //     ) revert InvalidWrapperForVault();
        //     mellowDepositWrappers[
        //         address(_mellowVault[i])
        //     ] = IMellowDepositWrapper(_mellowDepositWrapper[i]);
        //     mellowVaults.push(_mellowVault[i]);
        // }
        _asset = asset;
        _trusteeManager = trusteeManager;
    }

    function delegateToVault(uint256 amount, address vaultAddress)
        external
        onlyTrustee
        whenNotPaused
        returns (uint256 depositedAmount, uint256 mintedShares)
    {
        _asset.safeTransferFrom(_vault, address(this), amount);
        IERC20(_asset).safeIncreaseAllowance(vaultAddress, amount);
        return IVault(vaultAddress).deposit(address(this), amount);
    }

    function withdrawFromVault(address vaultAddress, uint256 amount)
        external
        onlyTrustee
        whenNotPaused
        returns (uint256)
    {
        IVault vault = IVault(vaultAddress);
        (, uint256 mintedShares) = vault.withdraw(address(this), amount);
        return mintedShares;
    }

    function claimWithdrawal(address vaultAddress, uint256 sEpoch)
        external
        onlyTrustee
        whenNotPaused
        returns (uint256)
    {
        return IVault(vaultAddress).claim(_vault, sEpoch);
    }

    function claimableAmount() external view returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    /// TODO
    function pendingRewards() external view returns (uint256) {
        return stakerRewards.claimable(address(_asset), address(this), "");
    }

    function addVault(address vault, address depositWrapper)
        external
        onlyOwner
    {
        if (vault == address(0) || depositWrapper == address(0))
            revert ZeroAddress();
        // if (
        //     address(IMellowDepositWrapper(depositWrapper).vault()) !=
        //     mellowVault
        // ) revert InvalidWrapperForVault();

        // for (uint8 i = 0; i < mellowVaults.length; i++) {
        //     if (mellowVault == address(mellowVaults[i])) {
        //         revert AlreadyAdded();
        //     }
        // }

        // mellowDepositWrappers[mellowVault] = IMellowDepositWrapper(
        //     depositWrapper
        // );
        // mellowVaults.push(IMellowVault(mellowVault));

        emit VaultAdded(vault, depositWrapper);
    }

    // function changeAllocation(address mellowVault, uint256 newAllocation)
    //     external
    //     onlyOwner
    // {
    //     if (mellowVault == address(0)) revert ZeroAddress();
    //     uint256 oldAllocation = allocations[mellowVault];
    //     allocations[mellowVault] = newAllocation;

    //     totalAllocations = totalAllocations + newAllocation - oldAllocation;

    //     emit AllocationChanged(mellowVault, oldAllocation, newAllocation);
    // }

    /// TODO
    function pendingWithdrawalAmount() external view returns (uint256 total) {
        /// TODO replace 1
        for (uint256 i = 0; i < vaults.length; i++)
            total += vaults[i].withdrawalsOf(1, address(this));

        return total;
    }

    function getDeposited(address vaultAddress) public view returns (uint256) {
        return IVault(vaultAddress).activeBalanceOf(address(this));
    }

    function getTotalDeposited() public view returns (uint256 total) {
        for (uint256 i = 0; i < vaults.length; i++)
            total += vaults[i].activeBalanceOf(address(this));

        return total;
    }

    function setVault(address vault) external onlyOwner {
        emit VaultSet(_vault, vault);
        _vault = vault;
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

    function getVersion() external pure returns (uint256) {
        return 1;
    }
}

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

    IMellowVault[] public vaults;

    mapping(address => uint256) public allocations;
    uint256 public totalAllocations;

    address public claimer;
    address public withdrawalQueue;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

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

    function withdraw(
        address vault,
        uint256 amount,
        bytes[] calldata /*_data */
    ) external onlyTrustee whenNotPaused returns (uint256) {
        uint256 balanceState = _asset.balanceOf(address(this));
        IERC4626(vault).withdraw(amount, address(this), address(this));

        return (_asset.balanceOf(address(this)) - balanceState);
    }

    function claim(
        bytes[] calldata /*_data */
    ) external onlyTrustee whenNotPaused returns (uint256) {
        _claimPending();
        uint256 amount = _asset.balanceOf(address(this));
        if (amount == 0) revert ValueZero();

        _asset.safeTransfer(_inceptionVault, amount);

        return amount;
    }

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

    function addMellowVault(address mellowVault) external onlyOwner {
        if (mellowVault == address(0)) revert ZeroAddress();

        for (uint8 i = 0; i < vaults.length; i++) {
            if (mellowVault == address(vaults[i])) revert AlreadyAdded();
        }

        vaults.push(IMellowVault(mellowVault));

        emit VaultAdded(mellowVault);
    }

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

    function getDeposited(
        address _mellowVault
    ) public view override returns (uint256) {
        IMellowVault mellowVault = IMellowVault(_mellowVault);
        uint256 balance = mellowVault.balanceOf(address(this));
        if (balance == 0) return 0;

        return IERC4626(address(mellowVault)).previewRedeem(balance);
    }

    function getTotalDeposited() public view override returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < vaults.length; i++) {
            uint256 balance = vaults[i].balanceOf(address(this));
            if (balance > 0)
                total += IERC4626(address(vaults[i])).previewRedeem(balance);
        }
        return total;
    }

    function inactiveBalance() public view returns (uint256) {
        return
            pendingWithdrawalAmount() +
            claimableWithdrawalAmount() +
            claimableAmount();
    }

    function amountToLpAmount(
        uint256 amount,
        IMellowVault mellowVault
    ) public view returns (uint256 lpAmount) {
        return IERC4626(address(mellowVault)).convertToShares(amount);
    }

    function lpAmountToAmount(
        uint256 lpAmount,
        IMellowVault mellowVault
    ) public view returns (uint256) {
        return IERC4626(address(mellowVault)).convertToAssets(lpAmount);
    }

    function setClaimer(address newClaimer) external onlyOwner {
        if (newClaimer == address(0)) revert ZeroAddress();

        emit ClaimerChanged(claimer, newClaimer);
        claimer = newClaimer;
    }

    function getVersion() external pure override returns (uint256) {
        return 3;
    }
}
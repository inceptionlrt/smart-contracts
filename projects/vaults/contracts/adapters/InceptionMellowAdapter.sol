// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IMellowAdapter} from "../interfaces/adapters/IMellowAdapter.sol";
import {IMellowDepositWrapper} from "../interfaces/symbiotic-vault/mellow-core/IMellowDepositWrapper.sol";
import {IMellowVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowVault.sol";
import {IEthWrapper} from "../interfaces/symbiotic-vault/mellow-core/IEthWrapper.sol";
import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";

import {InceptionBaseAdapter} from "./InceptionBaseAdapter.sol";

/**
 * @title InceptionMellowAdapter
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the Mellow protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract InceptionMellowAdapter is IMellowAdapter, InceptionBaseAdapter {
    using SafeERC20 for IERC20;

    /// @dev Kept only for storage slot
    mapping(address => IMellowDepositWrapper) private PLACE_HOLDER_1; // mellowVault => mellowDepositWrapper
    IMellowVault[] public mellowVaults;

    mapping(address => uint256) public allocations;
    uint256 public totalAllocations;

    /// @dev Kept only for storage slot
    uint256 private PLACE_HOLDER_2;
    /// @dev Kept only for storage slot
    uint256 private PLACE_HOLDER_3; // BasisPoints 10,000 = 100%
    /// @dev Kept only for storage slot
    uint256 private PLACE_HOLDER_4;

    address public ethWrapper;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    /**
     * @dev Initializes the Mellow adapter
     * @param _mellowVaults Array of Mellow vault addresses to support
     * @param asset Address of the asset token
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
            mellowVaults.push(_mellowVaults[i]);
            allocations[address(_mellowVaults[i])] = 1;
            totalAllocations_ += 1;
        }

        totalAllocations = totalAllocations_;
    }

    /**
     * @dev Delegates assets to a Mellow vault or distributes them automatically
     * @param mellowVault Address of the Mellow vault
     * @param amount Amount of assets to delegate
     * @param _data Additional data containing referral address and auto-delegation flag
     * @return depositedAmount Amount of assets actually deposited
     */
    function delegate(
        address mellowVault,
        uint256 amount,
        bytes[] calldata _data
    )
        external
        override
        onlyTrustee
        whenNotPaused
        returns (uint256 depositedAmount)
    {
        (address referral, bool delegateAuto) = abi.decode(
            _data[0],
            (address, bool)
        );

        if (!delegateAuto) return _delegate(mellowVault, amount, referral);
        else return _delegateAuto(amount, referral);
    }

    /**
     * @dev Internal function to delegate assets to a specific vault
     * @param mellowVault Address of the Mellow vault
     * @param amount Amount of assets to delegate
     * @param referral Address of the referral
     * @return depositedAmount Amount of assets actually deposited
     */
    function _delegate(
        address mellowVault,
        uint256 amount,
        address referral
    ) internal returns (uint256 depositedAmount) {

        bool exists;
        for (uint8 i = 0; i < mellowVaults.length; i++) {
            if (mellowVault == address(mellowVaults[i])) {
                exists = true;
                break;
            }
        }

        if (!exists) revert NotAdded();

        _asset.safeTransferFrom(msg.sender, address(this), amount);
        IERC20(_asset).safeIncreaseAllowance(address(ethWrapper), amount);

        uint256 lpAmount = IEthWrapper(ethWrapper).deposit(
                address(_asset),
                amount,
                mellowVault,
                address(this),
                referral
            );

        depositedAmount = lpAmountToAmount(lpAmount, IMellowVault(mellowVault));
    }

    /**
     * @dev Internal function to automatically distribute assets across all vaults
     * @param amount Amount of assets to delegate
     * @param referral Address of the referral
     * @return depositedAmount Amount of assets actually deposited
     */
    function _delegateAuto(
        uint256 amount,
        address referral
    ) internal returns (uint256 depositedAmount) {
        uint256 allocationsTotal = totalAllocations;
        _asset.safeTransferFrom(msg.sender, address(this), amount);

        for (uint8 i = 0; i < mellowVaults.length; i++) {
            uint256 allocation = allocations[address(mellowVaults[i])];
            if (allocation > 0) {
                uint256 localBalance = (amount * allocation) / allocationsTotal;
                IERC20(_asset).safeIncreaseAllowance(
                    address(ethWrapper),
                    localBalance
                );
                uint256 lpAmount = IEthWrapper(ethWrapper).deposit(
                    address(_asset),
                    localBalance,
                    address(mellowVaults[i]),
                    address(this),
                    referral
                );
                depositedAmount += lpAmountToAmount(lpAmount, mellowVaults[i]);
            }
        }

        uint256 left = _asset.balanceOf(address(this));
        if (left != 0) _asset.safeTransfer(_inceptionVault, left);
    }

    /**
     * @dev Withdraws assets from a Mellow vault
     * @param _mellowVault Address of the Mellow vault
     * @param amount Amount of assets to withdraw
     * @return withdrawnAmount Amount of assets actually withdrawn
     */
    function withdraw(
        address _mellowVault,
        uint256 amount,
        bytes[] calldata /*_data */
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        uint256 balanceState = _asset.balanceOf(address(this));
        IERC4626(_mellowVault).withdraw(amount, address(this), address(this));

        return (_asset.balanceOf(address(this)) - balanceState);
    }

    /**
     * @dev Claims rewards from all Mellow vaults
     */
    function claim(
        bytes[] calldata /*_data */
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        _claimPending();
        uint256 amount = _asset.balanceOf(address(this));
        if (amount == 0) revert ValueZero();

        _asset.safeTransfer(_inceptionVault, amount);

        return amount;
    }

    /**
     * @dev Internal function to claim pending rewards from all vaults
     */
    function _claimPending() private {
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            IMellowSymbioticVault(address(mellowVaults[i])).claim(
                address(this),
                address(this),
                type(uint256).max
            );
        }
    }

    /**
     * @dev Adds a new Mellow vault to the supported vaults list
     * @param mellowVault Address of the vault to add
     */
    function addMellowVault(address mellowVault) external onlyOwner {
        if (mellowVault == address(0)) revert ZeroAddress();

        for (uint8 i = 0; i < mellowVaults.length; i++) {
            if (mellowVault == address(mellowVaults[i])) revert AlreadyAdded();
        }

        mellowVaults.push(IMellowVault(mellowVault));

        emit VaultAdded(mellowVault);
    }

    /**
     * @dev Changes the allocation for a specific vault
     * @param mellowVault Address of the vault
     * @param newAllocation New allocation value
     */
    function changeAllocation(
        address mellowVault,
        uint256 newAllocation
    ) external onlyOwner {
        if (mellowVault == address(0)) revert ZeroAddress();

        bool exists;
        for (uint8 i = 0; i < mellowVaults.length; i++) {
            if (mellowVault == address(mellowVaults[i])) exists = true;
        }
        if (!exists) revert InvalidVault();
        uint256 oldAllocation = allocations[mellowVault];
        allocations[mellowVault] = newAllocation;

        totalAllocations = totalAllocations + newAllocation - oldAllocation;

        emit AllocationChanged(mellowVault, oldAllocation, newAllocation);
    }

    /**
     * @dev Returns the total amount of claimable assets across all vaults
     * @return total Total amount of claimable assets
     */
    function claimableWithdrawalAmount() public view returns (uint256 total) {
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            total += IMellowSymbioticVault(address(mellowVaults[i]))
                .claimableAssetsOf(address(this));
        }
    }

    /**
     * @dev Returns the amount of claimable assets for a specific vault
     * @param _mellowVault Address of the vault
     * @return amount Amount of claimable assets
     */
    function claimableWithdrawalAmount(
        address _mellowVault
    ) external view returns (uint256) {
        return
            IMellowSymbioticVault(_mellowVault).claimableAssetsOf(
                address(this)
            );
    }

    /**
     * @dev Returns the total amount of pending withdrawals across all vaults
     * @return total Total amount of pending withdrawals
     */
    function pendingWithdrawalAmount()
        public
        view
        override
        returns (uint256 total)
    {
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            total += IMellowSymbioticVault(address(mellowVaults[i]))
                .pendingAssetsOf(address(this));
        }
    }

    /**
     * @dev Returns the amount of pending withdrawals for a specific vault
     * @param _mellowVault Address of the vault
     * @return amount Amount of pending withdrawals
     */
    function pendingWithdrawalAmount(
        address _mellowVault
    ) external view returns (uint256) {
        return
            IMellowSymbioticVault(_mellowVault).pendingAssetsOf(address(this));
    }

    /**
     * @dev Returns the amount of assets deposited in a specific vault
     * @param _mellowVault Address of the vault
     * @return amount Amount of deposited assets
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
     * @dev Returns the total amount of assets deposited across all vaults
     * @return total Total amount of deposited assets
     */
    function getTotalDeposited() public view override returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            uint256 balance = mellowVaults[i].balanceOf(address(this));
            if (balance > 0)
                total += IERC4626(address(mellowVaults[i])).previewRedeem(
                    balance
                );
        }
        return total;
    }

    /**
     * @dev Returns the total inactive balance (pending withdrawals + claimable amount)
     * @return balance Total inactive balance
     */
    function inactiveBalance() public view override returns (uint256) {
        return
            pendingWithdrawalAmount() +
            claimableWithdrawalAmount() +
            claimableAmount();
    }

    /**
     * @dev Converts amount to LP token amount for a specific vault
     * @param amount Amount of assets
     * @param mellowVault Address of the vault
     * @return lpAmount Amount of LP tokens
     */
    function amountToLpAmount(
        uint256 amount,
        IMellowVault mellowVault
    ) public view returns (uint256 lpAmount) {
        return IERC4626(address(mellowVault)).convertToShares(amount);
    }

    /**
     * @dev Converts LP token amount to asset amount for a specific vault
     * @param lpAmount Amount of LP tokens
     * @param mellowVault Address of the vault
     * @return amount Amount of assets
     */
    function lpAmountToAmount(
        uint256 lpAmount,
        IMellowVault mellowVault
    ) public view returns (uint256) {
        return IERC4626(address(mellowVault)).convertToAssets(lpAmount);
    }

    /**
     * @dev Sets the ETH wrapper address
     * @param newEthWrapper Address of the new ETH wrapper
     */
    function setEthWrapper(address newEthWrapper) external onlyOwner {
        if (!Address.isContract(newEthWrapper)) revert NotContract();
        if (newEthWrapper == address(0)) revert ZeroAddress();

        address oldWrapper = ethWrapper;
        ethWrapper = newEthWrapper;
        emit EthWrapperChanged(oldWrapper, newEthWrapper);
    }

    /**
     * @dev Returns the contract version
     * @return version Contract version
     */
    function getVersion() external pure override returns (uint256) {
        return 3;
    }
}

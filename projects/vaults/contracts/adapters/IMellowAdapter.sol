// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IIMellowAdapter} from "../interfaces/adapters/IIMellowAdapter.sol";
import {IMellowDepositWrapper} from "../interfaces/symbiotic-vault/mellow-core/IMellowDepositWrapper.sol";
import {IMellowVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowVault.sol";
import {IEthWrapper} from "../interfaces/symbiotic-vault/mellow-core/IEthWrapper.sol";
import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";
import {IEmergencyClaimer} from "../interfaces/common/IEmergencyClaimer.sol";

import {IBaseAdapter} from "./IBaseAdapter.sol";

/**
 * @title The MellowAdapter Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the Mellow protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract IMellowAdapter is IIMellowAdapter, IBaseAdapter {
    using SafeERC20 for IERC20;

    /// @dev Kept only for storage slot
    mapping(address => IMellowDepositWrapper) public mellowDepositWrappers; // mellowVault => mellowDepositWrapper
    IMellowVault[] public mellowVaults;

    mapping(address => uint256) public allocations;
    uint256 public totalAllocations;

    /// @dev Kept only for storage slot
    uint256 public requestDeadline;
    /// @dev Kept only for storage slot
    uint256 public depositSlippage; // BasisPoints 10,000 = 100%
    /// @dev Kept only for storage slot
    uint256 public withdrawSlippage;

    address public ethWrapper;

    address internal _emergencyClaimer;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    /**
     * @notice Initializes the Mellow adapter with vaults and parameters
     * @param _mellowVaults Array of Mellow vault addresses
     * @param asset Address of the underlying asset
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
     * @notice Delegates funds to a Mellow vault either directly or automatically
     * @dev Can only be called by trustee when contract is not paused
     * @param mellowVault Address of the target Mellow vault
     * @param amount Amount of tokens to delegate
     * @param _data Additional data containing referral address and auto-delegation flag
     * @return depositedAmount The amount successfully deposited
     */
    function delegate(
        address mellowVault,
        uint256 amount,
        bytes[] calldata _data
    ) external override onlyTrustee whenNotPaused returns (uint256 depositedAmount)
    {
        (address referral, bool delegateAuto) = abi.decode(_data[0], (address, bool));
        if (!delegateAuto) return _delegate(mellowVault, amount, referral);
        else return _delegateAuto(amount, referral);
    }

    /**
    * @notice Checks if the specified Mellow Vault address is in the list of allowed vaults
    * @dev Iterates through the mellowVaults array and compares the provided address with each element
    * @param mellowVault The address of the vault to check
    * @return bool Returns true if the vault is found in the list, false otherwise
    **/
    function _beforeDelegate(address mellowVault) internal returns (bool) {
        for (uint8 i = 0; i < mellowVaults.length; i++) {
            if (mellowVault == address(mellowVaults[i])) {
                return true;
            }
        }

        return false;
    }

    /**
     * @notice Internal function to delegate funds to a specific vault
     * @param mellowVault Address of the Mellow vault
     * @param amount Amount to delegate
     * @param referral Referral address
     * @return Amount successfully deposited
     */
    function _delegate(
        address mellowVault,
        uint256 amount,
        address referral
    ) internal returns (uint256) {
        if (!_beforeDelegate(mellowVault)) revert NotAdded();

        _asset.safeTransferFrom(msg.sender, address(this), amount);
        IERC20(_asset).safeIncreaseAllowance(address(ethWrapper), amount);

        uint256 lpAmount = IEthWrapper(ethWrapper).deposit(
            address(_asset),
            amount,
            mellowVault,
            address(this),
            referral
        );

        return lpAmountToAmount(lpAmount, IMellowVault(mellowVault));
    }

    /**
     * @notice Internal function to automatically delegate funds across vaults
     * @param amount Total amount to delegate
     * @param referral Referral address
     * @return depositedAmount Total amount successfully deposited
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
     * @notice Withdraws funds from a Mellow vault
     * @dev Can only be called by trustee when contract is not paused
     * @param _mellowVault Address of the Mellow vault to withdraw from
     * @param amount Amount to withdraw
     * @param _data Additional withdrawal parameters
     * @param emergency Flag for emergency withdrawal
     * @return Tuple of (remaining amount to withdraw, amount claimed)
     */
    function withdraw(
        address _mellowVault,
        uint256 amount,
        bytes[] calldata _data,
        bool emergency
    ) external override onlyTrustee whenNotPaused returns (uint256, uint256) {
        address claimer = _getClaimer(emergency);
        uint256 balanceState = _asset.balanceOf(claimer);

        // claim from mellow
        IERC4626(_mellowVault).withdraw(amount, claimer, address(this));

        uint256 claimed = (_asset.balanceOf(claimer) - balanceState);
        if (claimed > 0) {
            claimer == address(this) ?
                _asset.safeTransfer(_inceptionVault, claimed) :
                _asset.safeTransferFrom(claimer, _inceptionVault, claimed);
        }

        return (amount - claimed, claimed);
    }

    /**
     * @notice Claims available rewards or withdrawn funds
     * @dev Can only be called by trustee
     * @param _data Array containing vault address and claim parameters
     * @param emergency Flag for emergency claim process
     * @return Amount of tokens claimed
     */
    function claim(bytes[] calldata _data, bool emergency) external override onlyTrustee whenNotPaused returns (uint256) {
        require(_data.length > 0, ValueZero());

        (address _mellowVault) = abi.decode(_data[0], (address));
        if (emergency) {
            return _emergencyClaim(_mellowVault);
        }

        IMellowSymbioticVault(_mellowVault).claim(
            address(this),
            address(this),
            type(uint256).max
        );

        uint256 amount = _asset.balanceOf(address(this));
        if (amount == 0) revert ValueZero();

        _asset.safeTransfer(_inceptionVault, amount);
        return amount;
    }

    /**
     * @notice Internal function to handle emergency claims
     * @param vaultAddress Address of the vault to claim from
     * @return Amount claimed
     */
    function _emergencyClaim(address vaultAddress) internal returns (uint256) {
        return IEmergencyClaimer(
            _getClaimer(true)
        ).claimMellow(vaultAddress, _inceptionVault, type(uint256).max);
    }

    /**
     * @notice Adds a new Mellow vault to the adapter
     * @param mellowVault Address of the new vault
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
     * @notice Changes allocation for a specific vault
     * @param mellowVault Address of the vault
     * @param newAllocation New allocation amount
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
     * @notice Returns the total amount available for withdrawal
     * @return total Amount that can be claimed
     */
    function claimableWithdrawalAmount() public view returns (uint256 total) {
        return _claimableWithdrawalAmount(address(this));
    }

    /**
     * @notice Internal function to calculate claimable withdrawal amount for an address
     * @param claimer Address to check claimable amount for
     * @return total Total claimable amount
     */
    function _claimableWithdrawalAmount(address claimer) internal view returns (uint256 total) {
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            total += IMellowSymbioticVault(address(mellowVaults[i]))
                .claimableAssetsOf(claimer);
        }
    }

    /**
     * @notice Returns the total amount of pending withdrawals
     * @return total Amount of pending withdrawals
     */
    function pendingWithdrawalAmount() public view override returns (uint256 total) {
        return _pendingWithdrawalAmount(_getClaimer(false));
    }

    /**
     * @notice Internal function to calculate pending withdrawal amount for an address
     * @param claimer Address to check pending withdrawals for
     * @return total Total pending withdrawal amount
     */
    function _pendingWithdrawalAmount(address claimer) internal view returns (uint256 total) {
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            total += IMellowSymbioticVault(address(mellowVaults[i]))
                .pendingAssetsOf(claimer);
        }
    }

    /**
     * @notice Returns pending withdrawal amount for a specific vault
     * @param _mellowVault Address of the vault to check
     * @return Amount of pending withdrawals for the vault
     */
    function pendingWithdrawalAmount(
        address _mellowVault
    ) external view returns (uint256) {
        return
            IMellowSymbioticVault(_mellowVault).pendingAssetsOf(address(this));
    }

    /**
     * @notice Returns the amount deposited in a specific vault
     * @param _mellowVault Address of the vault to check
     * @return Amount deposited in the vault
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
     * @notice Returns the total amount deposited across all vaults
     * @return Total amount deposited
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
     * @notice Returns the total inactive balance
     * @return Sum of pending withdrawals, claimable withdrawals, and claimable amount
     */
    function inactiveBalance() public view override returns (uint256) {
        return
            pendingWithdrawalAmount() +
            claimableWithdrawalAmount() +
            claimableAmount();
    }

    /**
     * @notice Returns the total inactive balance for emergency situations
     * @return Sum of emergency pending withdrawals, claimable withdrawals, and claimable amount
     */
    function inactiveBalanceEmergency() public view returns (uint256) {
        return
            _pendingWithdrawalAmount(_getClaimer(true)) +
            _claimableWithdrawalAmount(_getClaimer(true)) +
            claimableAmount(_getClaimer(true));
    }

    /**
     * @notice Converts token amount to LP token amount
     * @param amount Amount of tokens to convert
     * @param mellowVault Vault for conversion calculation
     * @return lpAmount Equivalent amount in LP tokens
     */
    function amountToLpAmount(
        uint256 amount,
        IMellowVault mellowVault
    ) public view returns (uint256 lpAmount) {
        return IERC4626(address(mellowVault)).convertToShares(amount);
    }

    /**
     * @notice Converts LP token amount to underlying token amount
     * @param lpAmount Amount of LP tokens to convert
     * @param mellowVault Vault for conversion calculation
     * @return Equivalent amount in underlying tokens
     */
    function lpAmountToAmount(
        uint256 lpAmount,
        IMellowVault mellowVault
    ) public view returns (uint256) {
        return IERC4626(address(mellowVault)).convertToAssets(lpAmount);
    }

    /**
     * @notice Sets the ETH wrapper contract address
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
     * @notice Sets the emergency claimer address
     * @dev Can only be called by owner
     * @param _newEmergencyClaimer New emergency claimer address
     */
    function setEmergencyClaimer(address _newEmergencyClaimer) external onlyOwner {
        emit EmergencyClaimerSet(_emergencyClaimer, _newEmergencyClaimer);
        _emergencyClaimer = _newEmergencyClaimer;
    }

    /**
     * @notice Internal function to determine the claimer address
     * @param emergency Whether to use emergency claimer
     * @return Address of the claimer
     */
    function _getClaimer(bool emergency) internal view virtual returns (address) {
        if (emergency) {
            return _emergencyClaimer;
        }
        return address(this);
    }

    /**
     * @notice Returns the contract version
     * @return Current version number (3)
     */
    function getVersion() external pure override returns (uint256) {
        return 3;
    }
}

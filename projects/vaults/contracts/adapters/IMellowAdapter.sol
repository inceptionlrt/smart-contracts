// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IIMellowAdapter} from "../interfaces/adapters/IIMellowAdapter.sol";
import {IMellowDepositWrapper} from "../interfaces/symbiotic-vault/mellow-core/IMellowDepositWrapper.sol";
import {IMellowVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowVault.sol";
import {IEthWrapper} from "../interfaces/symbiotic-vault/mellow-core/IEthWrapper.sol";
import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";

import {IBaseAdapter} from "./IBaseAdapter.sol";
import {MellowAdapterClaimer} from "../adapter-claimers/MellowAdapterClaimer.sol";

/**
 * @title The MellowAdapter Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the Mellow protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract IMellowAdapter is IIMellowAdapter, IBaseAdapter {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

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

    mapping(address => address) internal claimerVaults;
    address internal _emergencyClaimer;
    EnumerableSet.AddressSet internal pendingClaimers;
    address[] internal availableClaimers;

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
        address claimer = _getOrCreateClaimer(emergency);
        uint256 balanceState = _asset.balanceOf(claimer);

        // claim from mellow
        uint256 shares = IERC4626(_mellowVault).withdraw(amount, claimer, address(this));
        claimerVaults[claimer] = _mellowVault;

        uint256 claimedAmount = (_asset.balanceOf(claimer) - balanceState);
        if (claimedAmount > 0) {
            claimer == address(this) ?
                _asset.safeTransfer(_inceptionVault, claimedAmount) :
                _asset.safeTransferFrom(claimer, _inceptionVault, claimedAmount);
        }

        if (amount - claimedAmount == 0) {
            _removePendingClaimer(claimer);
        }

        emit MellowWithdrawn(amount - claimedAmount, claimedAmount, claimer);
        return (amount - claimedAmount, claimedAmount);
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

        (address _mellowVault, address claimer) = abi.decode(_data[0], (address, address));
        if (!emergency) {
            _removePendingClaimer(claimer);
        }

        // emergency claim available only for emergency claimer
        if (emergency && _emergencyClaimer != claimer) {
            revert OnlyEmergency();
        }

        uint256 amount = MellowAdapterClaimer(
            claimer
        ).claim(_mellowVault, address(this), type(uint256).max);

        if (amount == 0) revert ValueZero();
        _asset.safeTransfer(_inceptionVault, amount);

        return amount;
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
        return _claimableWithdrawalAmount(false);
    }

    /**
     * @notice Internal function to calculate claimable withdrawal amount for an address
     * @param emergency Emergency flag for claimer
     * @return total Total claimable amount
     */
    function _claimableWithdrawalAmount(bool emergency) internal view returns (uint256 total) {
        if (emergency) {
            for (uint256 i = 0; i < mellowVaults.length; i++) {
                total += IMellowSymbioticVault(address(mellowVaults[i]))
                    .claimableAssetsOf(_emergencyClaimer);
            }
            return total;
        }

        for (uint256 i = 0; i < pendingClaimers.length(); i++) {
            total += IMellowSymbioticVault(claimerVaults[pendingClaimers.at(i)])
                .claimableAssetsOf(pendingClaimers.at(i));
        }
        return total;
    }

    /**
     * @notice Returns the total amount of pending withdrawals
     * @return total Amount of pending withdrawals
     */
    function pendingWithdrawalAmount() public view override returns (uint256 total) {
        return _pendingWithdrawalAmount(false);
    }

    /**
     * @notice Internal function to calculate pending withdrawal amount for an address
     * @param emergency Emergency flag for claimer
     * @return total Total pending withdrawal amount
     */
    function _pendingWithdrawalAmount(bool emergency) internal view returns (uint256 total) {
        if (emergency) {
            for (uint256 i = 0; i < mellowVaults.length; i++) {
                total += IMellowSymbioticVault(address(mellowVaults[i]))
                    .pendingAssetsOf(_emergencyClaimer);
            }
            return total;
        }

        for (uint256 i = 0; i < pendingClaimers.length(); i++) {
            total += IMellowSymbioticVault(claimerVaults[pendingClaimers.at(i)])
                .pendingAssetsOf(pendingClaimers.at(i));
        }
        return total;
    }

    /**
     * @notice Returns pending withdrawal amount for a specific vault
     * @param _mellowVault Address of the vault to check
     * @param emergency Emergency claimer
     * @return total Amount of pending withdrawals for the vault
     */
    function pendingWithdrawalAmount(
        address _mellowVault, bool emergency
    ) external view returns (uint256 total) {
        if (emergency) {
            return IMellowSymbioticVault(_mellowVault).pendingAssetsOf(_emergencyClaimer);
        }
        for (uint256 i = 0; i < pendingClaimers.length(); i++) {
            total += IMellowSymbioticVault(_mellowVault).pendingAssetsOf(pendingClaimers.at(i));
        }
        return total;
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
     * @return Sum of pending withdrawals, claimable withdrawals
     */
    function inactiveBalance() public view override returns (uint256) {
        return pendingWithdrawalAmount() + claimableWithdrawalAmount();
    }

    /**
     * @notice Returns the total inactive balance for emergency situations
     * @return Sum of emergency pending withdrawals, claimable withdrawals, and claimable amount
     */
    function inactiveBalanceEmergency() public view returns (uint256) {
        return _pendingWithdrawalAmount(true) + _claimableWithdrawalAmount(true);
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
     * @notice Returns the contract version
     * @return Current version number (3)
     */
    function getVersion() external pure override returns (uint256) {
        return 3;
    }

    /// @notice Retrieves or creates a claimer address based on the emergency condition.
    /// @dev If `emergency` is true, returns the existing emergency claimer or deploys a new one if it doesn't exist.
    ///      If `emergency` is false, reuses an available claimer from the `availableClaimers` array or deploys a new one.
    ///      The returned claimer is added to the `pendingClaimers` set.
    /// @param emergency Boolean indicating whether an emergency claimer is required.
    /// @return claimer The address of the claimer to be used.
    function _getOrCreateClaimer(bool emergency) internal virtual returns (address claimer) {
        if (emergency) {
            if (_emergencyClaimer == address(0)) {
                _emergencyClaimer = _deployClaimer();
            }
            return _emergencyClaimer;
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

    /// @notice Removes a claimer from the pending list and recycles it to the available claimers.
    /// @dev Deletes the claimer's vault mapping, removes it from `pendingClaimers`, and adds it to `availableClaimers`.
    /// @param claimer The address of the claimer to be removed from pending status.
    function _removePendingClaimer(address claimer) internal {
        delete claimerVaults[claimer];
        pendingClaimers.remove(claimer);
        availableClaimers.push(claimer);
    }

    /// @notice Deploys a new MellowAdapterClaimer contract instance.
    /// @dev Creates a new claimer contract with the `_asset` address passed as a constructor parameter.
    /// @return The address of the newly deployed MellowAdapterClaimer contract.
    function _deployClaimer() internal returns (address) {
        return address(new MellowAdapterClaimer(address(_asset)));
    }
}

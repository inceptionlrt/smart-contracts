// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BeaconProxy, Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IInceptionMellowAdapter} from "../interfaces/adapters/IInceptionMellowAdapter.sol";
import {IMellowDepositWrapper} from "../interfaces/symbiotic-vault/mellow-core/IMellowDepositWrapper.sol";
import {IMellowVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowVault.sol";
import {IEthWrapper} from "../interfaces/symbiotic-vault/mellow-core/IEthWrapper.sol";
import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";
import {IStakerRewards} from "../interfaces/symbiotic-vault/symbiotic-core/IStakerRewards.sol";
import {IMultiVaultStorage} from "../interfaces/symbiotic-vault/mellow-core/IMultiVaultStorage.sol";
import {IWithdrawalQueue} from "../interfaces/symbiotic-vault/mellow-core/IWithdrawalQueue.sol";
import {IWStethInterface as IWstEth, IStEth} from "../interfaces/common/IStEth.sol";

import {InceptionBaseAdapter} from "./InceptionBaseAdapter.sol";
import {MellowV3AdapterClaimer} from "../adapter-claimers/MellowV3AdapterClaimer.sol";

import "hardhat/console.sol";

interface IWithdrawalQueueERC721 {
    struct WithdrawalRequestStatus {
        uint256 amountOfStETH;
        uint256 amountOfShares;
        address owner;
        uint256 timestamp;
        bool isFinalized;
        bool isClaimed;
    }

    function getWithdrawalRequests(address _owner) external view returns (uint256[] memory requestsIds);

    function requestWithdrawalsWstETH(uint256[] calldata _amounts, address _owner) external returns (uint256[] memory requestIds);

    function getWithdrawalStatus(uint256[] calldata _requestIds) external view returns (WithdrawalRequestStatus[] memory statuses);

    function claimWithdrawal(uint256 _requestId) external;
}

interface IWeth {
    function deposit() payable external;

    function withdraw(uint wad) external;
}

/**
 * @title The InceptionWstETHMellowAdapter Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the Mellow protocol for wstETH asset token.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner and used for wstETH asset.
 */
contract InceptionWstETHMellowV3Adapter is
    IInceptionMellowAdapter,
    InceptionBaseAdapter
{
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

    address public lidoWithdrawalQueue;

    mapping(address => address) internal _claimerVaults;
    address internal _emergencyClaimer;
    EnumerableSet.AddressSet internal pendingClaimers;
    address[] internal availableClaimers;

    address internal _claimerImplementation;

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
        __InceptionBaseAdapter_init(asset, trusteeManager);

        uint256 totalAllocations_;
        for (uint256 i = 0; i < _mellowVaults.length; i++) {
            for (uint8 j = 0; j < i; j++)
                if (address(_mellowVaults[i]) == address(_mellowVaults[j]))
                    revert AlreadyAdded();
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
    )
        external
        override
        onlyTrustee
        whenNotPaused
        returns (uint256 depositedAmount)
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
    function _beforeDelegate(address mellowVault) internal view returns (bool) {
        for (uint8 i = 0; i < mellowVaults.length; i++) {
            if (mellowVault == address(mellowVaults[i])) return true;
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
        require(_beforeDelegate(mellowVault), NotAdded());

        _asset.safeTransferFrom(msg.sender, address(this), amount);
        IERC20(_asset).safeIncreaseAllowance(ethWrapper, amount);

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
     * @param emergency Flag for emergency withdrawal
     * @return Tuple of (remaining amount to withdraw, amount claimed)
     */
    function withdraw(
        address _mellowVault,
        uint256 amount,
        bytes[] calldata /*_data*/,
        bool emergency
    )
        external
        override
        onlyTrustee
        whenNotPaused
        returns (uint256, uint256)
    {
        address claimer = _getOrCreateClaimer(emergency);

        IERC20 wrappedAsset = IERC20(IEthWrapper(ethWrapper).wstETH());
        uint256 balanceState = wrappedAsset.balanceOf(claimer);

        // claim from mellow
        IERC4626(_mellowVault).withdraw(
            convertAssetToUnderlying(amount), claimer, address(this)
        );
        _claimerVaults[claimer] = _mellowVault;

        uint256 claimedAmount = (wrappedAsset.balanceOf(claimer) - balanceState);
        uint256 undelegatedAmount = amount - claimedAmount;

        if (claimedAmount > 0) {
            claimer == address(this)
                ? wrappedAsset.safeTransfer(_inceptionVault, claimedAmount)
                : wrappedAsset.safeTransferFrom(
                    claimer,
                    _inceptionVault,
                    claimedAmount
                );
        }

        if (undelegatedAmount == 0) _removePendingClaimer(claimer);

        emit MellowWithdrawn(undelegatedAmount, claimedAmount, claimer);
        return (undelegatedAmount, claimedAmount);
    }

    /**
     * @notice Claims available rewards or withdrawn funds
     * @dev Can only be called by trustee
     * @param _data Array containing vault address and claim parameters
     * @param emergency Flag for emergency claim process
     * @return Amount of tokens claimed
     */
    function claimFromMellow(bytes[] calldata _data, bool emergency)
        external
        onlyTrustee
        whenNotPaused
        returns (uint256)
    {
        require(_data.length > 0, ValueZero());
        (address _mellowVault, address claimer) = abi.decode(_data[0], (address, address));

        address wstETH = IEthWrapper(ethWrapper).wstETH();
        console.logUint(IERC20(wstETH).balanceOf(claimer));
        uint256 amount = _claimPending(_mellowVault, claimer);
        console.logUint(IERC20(wstETH).balanceOf(claimer));
        require(amount > 0, ValueZero());

        uint256 requestID = _unstakeFromLido(claimer);
        emit LidoUnstaked(requestID);

        return amount;
    }

    /**
     * @notice Claims available rewards or withdrawn funds
     * @dev Can only be called by trustee
     * @param _data Array containing vault address and claim parameters
     * @param emergency Flag for emergency claim process
     * @return Amount of tokens claimed
     */
    function claim(bytes[] calldata _data, bool emergency)
        external
        override
        onlyTrustee
        whenNotPaused
        returns (uint256)
    {
        require(_data.length > 0, ValueZero());
        (address _mellowVault, address claimer) = abi.decode(_data[0], (address, address));

        // emergency claim available only for emergency claimer
        if ((emergency && _emergencyClaimer != claimer) || (!emergency && claimer == _emergencyClaimer)) revert OnlyEmergency();
        if (!emergency && _claimerVaults[claimer] != _mellowVault) revert InvalidVault();
        if (!emergency) _removePendingClaimer(claimer);

        uint256 amount = _claimFromLido(claimer);
        require(amount > 0, ValueZero());
        _asset.safeTransfer(_inceptionVault, amount);

        return amount;
    }

    function _claimPending(address _mellowVault, address claimer) internal returns (uint256) {
        uint256 amount; uint256 numbers;
        uint256 length = IMultiVaultStorage(_mellowVault).subvaultsCount();

        uint256[] memory claimableArray = new uint256[](length);
        uint256[] memory subvaultIndices;
        uint256[][] memory indices;

        address mellowClaimer;

        for (uint256 j = 0; j < length; j++) {
            claimableArray[j] = IWithdrawalQueue(
                IMultiVaultStorage(_mellowVault).subvaultAt(j).withdrawalQueue
            ).claimableAssetsOf(claimer);

            mellowClaimer = IWithdrawalQueue(
                IMultiVaultStorage(_mellowVault).subvaultAt(j).withdrawalQueue
            ).claimer();

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

        return MellowV3AdapterClaimer(claimer).claim(
            mellowClaimer,
            _mellowVault,
            subvaultIndices,
            indices,
            claimer,
            amount
        );
    }

    function _claimFromLido(address claimer) internal returns (uint256) {
        uint256[] memory ids = IWithdrawalQueueERC721(lidoWithdrawalQueue)
            .getWithdrawalRequests(claimer);

        IWithdrawalQueueERC721.WithdrawalRequestStatus[] memory status
            = IWithdrawalQueueERC721(lidoWithdrawalQueue)
                .getWithdrawalStatus(ids);

        for (uint256 i = 0; i < status.length; i++) {
            if (status[i].isFinalized) {
                MellowV3AdapterClaimer(claimer).claimLidoWithdrawal(
                    lidoWithdrawalQueue, ids[i], address(_asset)
                );
            }
        }

        uint256 ethBalance = address(this).balance;
        if (ethBalance != 0) IWeth(address(_asset)).deposit{value: ethBalance}();

        return ethBalance;
    }

    function _unstakeFromLido(address claimer) internal returns (uint256 requestId) {
        address wstETH = IEthWrapper(ethWrapper).wstETH();
        uint256 balance = IERC20(wstETH).balanceOf(claimer);

        console.logString("=====");
        console.logUint(balance);

        return MellowV3AdapterClaimer(claimer).requestWithdrawalsWstETH(
            lidoWithdrawalQueue, balance
        )[0];
    }

    /**
     * @notice Adds a new Mellow vault to the adapter
     * @param mellowVault Address of the new vault
     */
    function addMellowVault(address mellowVault) external onlyOwner {
        require(mellowVault != address(0), ZeroAddress());

        for (uint8 i = 0; i < mellowVaults.length; i++) {
            require(mellowVault != address(mellowVaults[i]), AlreadyAdded());
        }

        mellowVaults.push(IMellowVault(mellowVault));

        emit VaultAdded(mellowVault);
    }

    /**
     * @notice Remove a Mellow vault from the adapter
     * @param vault Address of the mellow vault to be removed
     */
    function removeVault(address vault) external onlyOwner {
        require(vault != address(0), ZeroAddress());
        require(
            getDeposited(vault) == 0 &&
            pendingWithdrawalAmount(vault, true) == 0 &&
            pendingWithdrawalAmount(vault, false) == 0,
            VaultNotEmpty()
        );

        uint256 index = type(uint256).max;
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            if (address(mellowVaults[i]) == vault) {
                index = i;
                break;
            }
        }

        require(index != type(uint256).max, InvalidVault());

        mellowVaults[index] = mellowVaults[mellowVaults.length - 1];
        mellowVaults.pop();

        emit VaultRemoved(vault);
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
        require(mellowVault != address(0), ZeroAddress());

        bool exists;
        for (uint8 i = 0; i < mellowVaults.length; i++) {
            if (mellowVault == address(mellowVaults[i])) exists = true;
        }
        require(exists, InvalidVault());
        uint256 oldAllocation = allocations[mellowVault];
        allocations[mellowVault] = newAllocation;

        totalAllocations = totalAllocations + newAllocation - oldAllocation;

        emit AllocationChanged(mellowVault, oldAllocation, newAllocation);
    }

    /**
     * @notice Claim rewards from Mellow protocol.
     * @dev Rewards distribution functionality is not yet available in the Mellow protocol.
     */
    function claimRewards(
        address /*rewardToken*/,
        bytes memory /*rewardsData*/
    ) external view onlyTrustee {
        // Rewards distribution functionality is not yet available in the Mellow protocol.
        revert("Mellow distribution rewards not implemented yet");
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
    function _claimableWithdrawalAmount(
        bool emergency
    ) internal view returns (uint256 total) {
        if (emergency) {
            uint256 length;
            for (uint256 i = 0; i < mellowVaults.length; i++) {
                length = IMultiVaultStorage(address(mellowVaults[i])).subvaultsCount();
                for (uint256 j = 0; j < length; j++) {
                    IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(
                        address(mellowVaults[i])
                    ).subvaultAt(j);

                    total += IWithdrawalQueue(
                        subvault.withdrawalQueue
                    ).claimableAssetsOf(_emergencyClaimer);
                }
            }

            return total;
        }

        for (uint256 claimerIndex = 0; claimerIndex < pendingClaimers.length(); claimerIndex++) {
            uint256 length;
            for (uint256 i = 0; i < mellowVaults.length; i++) {
                length = IMultiVaultStorage(address(mellowVaults[i])).subvaultsCount();
                for (uint256 j = 0; j < length; j++) {
                    IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(
                        address(mellowVaults[i])
                    ).subvaultAt(j);

                    total += IWithdrawalQueue(
                        subvault.withdrawalQueue
                    ).claimableAssetsOf(pendingClaimers.at(claimerIndex));
                }
            }
        }

        return total;
    }

    /**
     * @notice Returns the total amount of pending withdrawals
     * @return total Amount of pending withdrawals
     */
    function pendingWithdrawalAmount() public view override returns (uint256 total) {
        return _pendingWithdrawalAmount(false) + _claimableWithdrawalAmount(false);
    }

    /**
     * @notice Returns the total inactive balance for emergency situations
     * @return Sum of emergency pending withdrawals, claimable withdrawals, and claimable amount
     */
    function pendingEmergencyWithdrawalAmount() public view returns (uint256) {
        return _pendingWithdrawalAmount(true) + _claimableWithdrawalAmount(true);
    }

    /**
     * @notice Internal function to calculate pending withdrawal amount for an address
     * @param emergency Emergency flag for claimer
     * @return total Total pending withdrawal amount
     */
    function _pendingWithdrawalAmount(
        bool emergency
    ) internal view returns (uint256 total) {
        if (emergency) {
            uint256 length;

            for (uint256 i = 0; i < mellowVaults.length; i++) {
                length = IMultiVaultStorage(address(mellowVaults[i])).subvaultsCount();
                for (uint256 j = 0; j < length; j++) {
                    IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(
                        address(mellowVaults[i])
                    ).subvaultAt(j);

                    total += IWithdrawalQueue(subvault.withdrawalQueue).pendingAssetsOf(
                        _emergencyClaimer
                    );
                }
            }

            return total;
        }

        for (uint256 i = 0; i < pendingClaimers.length(); i++) {
            uint256 length;
            for (uint256 j = 0; j < mellowVaults.length; j++) {
                length = IMultiVaultStorage(address(mellowVaults[j])).subvaultsCount();
                for (uint256 k = 0; k < length; k++) {
                    IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(
                        address(mellowVaults[j])
                    ).subvaultAt(k);

                    total += IWithdrawalQueue(subvault.withdrawalQueue).pendingAssetsOf(
                        pendingClaimers.at(i)
                    );
                }
            }
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
        address _mellowVault,
        bool emergency
    ) public view returns (uint256 total) {
        if (emergency) {
            uint256 length = IMultiVaultStorage(_mellowVault).subvaultsCount();
            for (uint256 i = 0; i < length; i++) {
                IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(
                    _mellowVault
                ).subvaultAt(i);

                total += IWithdrawalQueue(
                    subvault.withdrawalQueue
                ).pendingAssetsOf(_emergencyClaimer);
            }

            return total;
        }

        for (uint256 i = 0; i < pendingClaimers.length(); i++) {
            uint256 length = IMultiVaultStorage(_mellowVault).subvaultsCount();
            for (uint256 j = 0; j < length; j++) {
                IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(
                    _mellowVault
                ).subvaultAt(j);

                total += IWithdrawalQueue(
                    subvault.withdrawalQueue
                ).pendingAssetsOf(pendingClaimers.at(i));
            }
        }

        return total;
    }

    /**
     * @notice Returns the total amount tokens related to adapter
     * @return total is the total amount tokens related to adapter
     */
    function getTotalBalance() external view returns (uint256) {
        return inactiveBalance() + getTotalDeposited();
    }

    /**
     * @notice Returns the total amount deposited across all vaults
     * @return total is the total amount deposited
     */
    function getTotalDeposited() public view override returns (uint256 total) {
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            total += getDeposited(address(mellowVaults[i]));
        }
    }

    /**
     * @notice Returns the total inactive balance
     * @return Sum of pending withdrawals, pending emergency withdrawals, claimable amounts
     */
    function inactiveBalance() public view override returns (uint256) {
        return pendingWithdrawalAmount() + pendingEmergencyWithdrawalAmount() + claimableAmount();
    }

    /**
     * @notice Returns the amount deposited in a specific vault
     * @param _mellowVault Address of the vault to check
     * @return Amount deposited in the vault
     */
    function getDeposited(address _mellowVault)
        public
        view
        override
        returns (uint256)
    {
        IMellowVault mellowVault = IMellowVault(_mellowVault);
        uint256 balance = mellowVault.balanceOf(address(this));
        if (balance == 0) return 0;

        return convertUnderlyingToAsset(
            IERC4626(address(mellowVault)).previewRedeem(balance)
        );
    }

    function convertUnderlyingToAsset(uint256 amount) private view returns (uint256) {
//        console.logString("wstETH");
//        console.log(amount);

        uint256 stETHAmount = IWstEth(
            IEthWrapper(ethWrapper).wstETH()
        ).getStETHByWstETH(amount);

//        console.logString("stETH");
//        console.log(stETHAmount);

        return stETHAmount;

//        // ratio is fixed 1:1
//        return IStEth(
//            IEthWrapper(ethWrapper).stETH()
//        ).getPooledEthByShares(stETHAmount);
    }

    function convertAssetToUnderlying(uint256 amount) private view returns (uint256) {
        return IWstEth(
            IEthWrapper(ethWrapper).wstETH()
        ).getWstETHByStETH(amount);
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
        require(Address.isContract(newEthWrapper), NotContract());

        address oldWrapper = ethWrapper;
        ethWrapper = newEthWrapper;
        emit EthWrapperChanged(oldWrapper, newEthWrapper);
    }

    /**
     * @notice Sets the implementation address for the claimer
     * @param newImplementation The address of the new implementation
     */
    function setClaimerImplementation(
        address newImplementation
    ) external onlyOwner {
        emit EmergencyClaimerSet(_claimerImplementation, newImplementation);
        _claimerImplementation = newImplementation;
    }

    function setLidoWithdrawalQueue(address queue) external onlyOwner {
        require(Address.isContract(queue), NotContract());
        lidoWithdrawalQueue = queue;
    }

    /**
     * @notice Returns the contract version
     * @return Current version number (3)
     */
    function getVersion() external pure override returns (uint256) {
        return 3;
    }

    /**
     * @notice Retrieves or creates a claimer address based on the emergency condition
     * @dev If `emergency` is true, returns the existing emergency claimer or deploys a new one if it doesn't exist.
     *      If `emergency` is false, reuses an available claimer from the `availableClaimers` array or deploys a new one.
     *      The returned claimer is added to the `pendingClaimers` set
     * @param emergency Boolean indicating whether an emergency claimer is required
     * @return claimer The address of the claimer to be used
     */
    function _getOrCreateClaimer(
        bool emergency
    ) internal virtual returns (address claimer) {
        if (emergency) {
            return
                _emergencyClaimer != address(0)
                    ? _emergencyClaimer
                    : (_emergencyClaimer = _deployClaimer());
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

    /**
     * @notice Removes a claimer from the pending list and recycles it to the available claimers
     * @dev Deletes the claimer's vault mapping, removes it from `pendingClaimers`, and adds it to `availableClaimers`
     * @param claimer The address of the claimer to be removed from pending status
     */
    function _removePendingClaimer(address claimer) internal {
        delete _claimerVaults[claimer];
        pendingClaimers.remove(claimer);
        availableClaimers.push(claimer);
    }

    /**
     * @notice Deploys a new MellowAdapterClaimer contract instance
     * @dev Creates a new claimer contract with the `_asset` address passed as a initialize parameter
     * @dev ownership is transferred to the adapter owner
     * @return The address of the newly deployed MellowAdapterClaimer contract
     */
    function _deployClaimer() internal returns (address) {
        if (_claimerImplementation == address(0))
            revert ClaimerImplementationNotSet();
        // deploy new beacon proxy and do init call
        bytes memory data = abi.encodeWithSignature(
            "initialize(address)",
            address(_asset)
        );
        address claimer = address(new BeaconProxy(address(this), data));

        (bool success,) = claimer.call(
            abi.encodeWithSignature("transferOwnership(address)", owner())
        );
        require(success, TransferOwnershipFailed());

        emit ClaimerDeployed(claimer);
        return claimer;
    }

    /**
     * @notice Beacon proxy implementation address
     * @return The address of the claimer implementation
     */
    function implementation() external view returns (address) {
        return _claimerImplementation;
    }
}

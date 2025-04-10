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
import {IWStethInterface as IWstEth, IStEth} from "../interfaces/common/IStEth.sol";

import {IMultiVaultStorage} from "../interfaces/symbiotic-vault/mellow-core/IMultiVaultStorage.sol";
import {IWithdrawalQueue} from "../interfaces/symbiotic-vault/mellow-core/IWithdrawalQueue.sol";
import {IClaimer} from "../interfaces/symbiotic-vault/mellow-core/IClaimer.sol";

import {IBaseAdapter} from "./IBaseAdapter.sol";
import {MellowV3AdapterClaimer} from "../adapter-claimers/MellowV3AdapterClaimer.sol";

import "hardhat/console.sol";
import {stETH} from "../tests/Lido/stETH.sol";

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
 * @title The MellowAdapter Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the Mellow protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract IMellowAdapterV3 is IIMellowAdapter, IBaseAdapter {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

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

    address public withdrawalQueue;

    address internal _emergencyClaimer;
    address internal _mellowClaimer;
    EnumerableSet.AddressSet internal pendingClaimers;
    mapping(address => address) internal claimerVaults;
    address[] internal availableClaimers;

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
            mellowVaults.push(_mellowVaults[i]);
            allocations[address(_mellowVaults[i])] = 1;
            totalAllocations_ += 1;
        }

        totalAllocations = totalAllocations_;
    }

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

    function withdraw(
        address _mellowVault,
        uint256 amount,
        bytes[] calldata _data,
        bool emergency
    ) external override onlyTrustee whenNotPaused returns (uint256, uint256) {
        address claimer = _getOrCreateClaimer(emergency);
        uint256 balanceState = _asset.balanceOf(claimer);

        // claim from mellow
        IERC4626(_mellowVault).withdraw(
            convertAssetToUnderlying(amount), claimer, address(this)
        );

        // save vault for given claimer
        claimerVaults[claimer] = _mellowVault;

        uint256 claimedAmount = (_asset.balanceOf(claimer) - balanceState);
        if (claimedAmount > 0) {
            _asset.safeTransferFrom(claimer, _inceptionVault, claimedAmount);
        }

        emit MellowWithdrawn(amount - claimedAmount, claimedAmount, claimer);

        return (amount - claimedAmount, claimedAmount);
    }

    function claimFromMellow(
        bytes[] calldata _data,
        bool emergency
    ) external onlyTrustee whenNotPaused returns (uint256) {
        require(_data.length > 0, ValueZero());
        (address _mellowVault, address claimer) = abi.decode(_data[0], (address, address));

        uint256 amount = _claimPending(_mellowVault, claimer);
        uint256 requestID = _unstakeFromLido(claimer);
        emit LidoUnstaked(requestID);

        return amount;
    }

    function _claimPending(address _mellowVault, address claimer) private returns (uint256) {
        uint256 amount;
        uint256 numbers;
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

    function _unstakeFromLido(address claimer) internal returns (uint256 requestId) {
        address wstETH = IEthWrapper(ethWrapper).wstETH();
        uint256 balance = IERC20(wstETH).balanceOf(claimer);

        return MellowV3AdapterClaimer(claimer).requestWithdrawalsWstETH(
            withdrawalQueue, balance
        )[0];
    }

    function claim(
        bytes[] calldata _data,
        bool emergency
    ) public onlyTrustee returns (uint256) {
        require(_data.length > 0, ValueZero());
        (address claimer) = abi.decode(_data[0], (address));

        uint256 balance = _asset.balanceOf(address(this));
        _claimFromLido(claimer);

        if (!emergency) {
            _removePendingClaimer(claimer);
        }

        console.logString("claim()");
        console.logUint(address(this).balance);
        console.logUint(_asset.balanceOf(address(this)) - balance);

        return _asset.balanceOf(address(this)) - balance;
    }

    function _claimFromLido(address claimer) internal {
        uint256[] memory ids = IWithdrawalQueueERC721(withdrawalQueue).getWithdrawalRequests(claimer);
        IWithdrawalQueueERC721.WithdrawalRequestStatus[] memory status = IWithdrawalQueueERC721(withdrawalQueue).getWithdrawalStatus(ids);
        for (uint256 i = 0; i < status.length; i++) {
            if (status[i].isFinalized) {
                IWithdrawalQueueERC721(withdrawalQueue).claimWithdrawal(ids[i]);
            }// TODO Maybe use claimWithdrawals or claimWithdrawalsOf to avoid unbounded loop
        }

        uint256 ethBalance = address(this).balance;
        if (ethBalance != 0) IWeth(address(_asset)).deposit{value: ethBalance}();
    }

    function addMellowVault(address mellowVault) external onlyOwner {
        if (mellowVault == address(0)) revert ZeroAddress();

        for (uint8 i = 0; i < mellowVaults.length; i++) {
            if (mellowVault == address(mellowVaults[i])) revert AlreadyAdded();
        }

        mellowVaults.push(IMellowVault(mellowVault));

        emit VaultAdded(mellowVault);
    }

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

    function claimableWithdrawalLido() public view returns (uint256 total) {
        uint256[] memory ids = IWithdrawalQueueERC721(withdrawalQueue).getWithdrawalRequests(address(this));
        IWithdrawalQueueERC721.WithdrawalRequestStatus[] memory status = IWithdrawalQueueERC721(withdrawalQueue).getWithdrawalStatus(ids);
        for (uint256 i = 0; i < status.length; i++) {
            if (status[i].isFinalized && !status[i].isClaimed) total += status[i].amountOfStETH;
        }
    }

    function pendingWithdrawalLido() public view returns (uint256 total) {
        uint256[] memory ids = IWithdrawalQueueERC721(withdrawalQueue).getWithdrawalRequests(address(this));
        IWithdrawalQueueERC721.WithdrawalRequestStatus[] memory status = IWithdrawalQueueERC721(withdrawalQueue).getWithdrawalStatus(ids);
        for (uint256 i = 0; i < status.length; i++) {
            if (!status[i].isFinalized) total += status[i].amountOfStETH;
        }
    }

    function claimableWithdrawalAmount() public view returns (uint256 total) {
        uint256 length;

        for (uint256 i = 0; i < mellowVaults.length; i++) {
            length = IMultiVaultStorage(address(mellowVaults[i])).subvaultsCount();

            for (uint256 j = 0; j < length; j++) {
                IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(address(mellowVaults[i])).subvaultAt(j);
                total += IWithdrawalQueue(subvault.withdrawalQueue).claimableAssetsOf(address(this));
            }
        }
    }

    function claimableWithdrawalAmount(
        address _mellowVault
    ) external view returns (uint256 assets) {

        uint256 length = IMultiVaultStorage(_mellowVault).subvaultsCount();

        for (uint256 i = 0; i < length; i++) {
            IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(_mellowVault).subvaultAt(i);
            assets += IWithdrawalQueue(subvault.withdrawalQueue).claimableAssetsOf(address(this));
        }
    }

    function pendingWithdrawalAmount()
    public
    view
    override
    returns (uint256 total)
    {
        uint256 length;

        for (uint256 i = 0; i < mellowVaults.length; i++) {

            length = IMultiVaultStorage(address(mellowVaults[i])).subvaultsCount();

            for (uint256 j = 0; j < length; j++) {
                IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(address(mellowVaults[i])).subvaultAt(j);
                total += IWithdrawalQueue(subvault.withdrawalQueue).pendingAssetsOf(address(this));
            }
        }
    }

    function pendingWithdrawalAmount(
        address _mellowVault
    ) external view returns (uint256 assets) {

        uint256 length = IMultiVaultStorage(_mellowVault).subvaultsCount();

        for (uint256 i = 0; i < length; i++) {
            IMultiVaultStorage.Subvault memory subvault = IMultiVaultStorage(_mellowVault).subvaultAt(i);
            assets += IWithdrawalQueue(subvault.withdrawalQueue).pendingAssetsOf(address(this));
        }
    }

    function getDeposited(
        address _mellowVault
    ) public view override returns (uint256) {
        IMellowVault mellowVault = IMellowVault(_mellowVault);
        uint256 balance = mellowVault.balanceOf(address(this));
        if (balance == 0) return 0;

        return convertUnderlyingToAsset(
            IERC4626(address(mellowVault)).previewRedeem(balance)
        );
    }

    function getTotalDeposited() public view override returns (uint256 total) {
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            total += getDeposited(address(mellowVaults[i]));
        }
    }

    function inactiveBalance() public view override returns (uint256) {
        return
            pendingWithdrawalAmount() +
            claimableWithdrawalAmount() +
            claimableAmount() +
            pendingWithdrawalLido() +
            claimableWithdrawalLido();
    }

    function inactiveBalanceEmergency() public view returns (uint256) {
        return 0;
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

    function setEthWrapper(address newEthWrapper) external onlyOwner {
        if (!Address.isContract(newEthWrapper)) revert NotContract();
        if (newEthWrapper == address(0)) revert ZeroAddress();

        address oldWrapper = ethWrapper;
        ethWrapper = newEthWrapper;
        emit EthWrapperChanged(oldWrapper, newEthWrapper);
    }

    function setMellowClaimer(address newClaimer) external onlyOwner {
        if (!Address.isContract(newClaimer)) revert NotContract();
        if (newClaimer == address(0)) revert ZeroAddress();

        address oldClaimer = _mellowClaimer;
        _mellowClaimer = newClaimer;

        emit ClaimerChanged(oldClaimer, newClaimer);
    }

    function setLidoWithdrawalQueue(address queue) external onlyOwner {
        if (!Address.isContract(queue)) revert NotContract();

        withdrawalQueue = queue;
    }

    function getVersion() external pure override returns (uint256) {
        return 3;
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

    /// @notice Deploys a new contract instance.
    /// @dev Creates a new claimer contract with the `_asset` address passed as a constructor parameter.
    /// @return The address of the newly deployed MellowAdapterClaimer contract.
    function _deployClaimer() internal returns (address) {
        return address(new MellowV3AdapterClaimer(address(_asset)));
    }
}

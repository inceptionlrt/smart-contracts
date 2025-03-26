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

import {IMultiVaultStorage} from "../interfaces/symbiotic-vault/mellow-core/IMultiVaultStorage.sol";
import {IWithdrawalQueue} from "../interfaces/symbiotic-vault/mellow-core/IWithdrawalQueue.sol";
import {IClaimer} from "../interfaces/symbiotic-vault/mellow-core/IClaimer.sol";

import {IBaseAdapter} from "./IBaseAdapter.sol";

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

    address public claimer;
    address public wstETH;
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
        IERC20(_asset).safeIncreaseAllowance(address(mellowVault), amount);

        uint256 lpAmount = IERC4626(mellowVault).deposit(amount, address(this));

        depositedAmount = lpAmountToAmount(lpAmount, IMellowVault(mellowVault));
    }

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
                uint256 lpAmount = IERC4626(address(mellowVaults[i])).deposit(localBalance, address(this));

                depositedAmount += lpAmountToAmount(lpAmount, mellowVaults[i]);
            }
        }

        uint256 left = _asset.balanceOf(address(this));
        if (left != 0) _asset.safeTransfer(_inceptionVault, left);
    }

    function withdraw(
        address _mellowVault,
        uint256 amount,
        bytes[] calldata /*_data */
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        uint256 balanceState = _asset.balanceOf(address(this));
        IERC4626(_mellowVault).withdraw(amount, address(this), address(this));

        return (_asset.balanceOf(address(this)) - balanceState);
    }

    function claim(
        bytes[] calldata /*_data */
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        _claimPending();
        uint256 amount = _asset.balanceOf(address(this));
        if (amount == 0) revert ValueZero();

        _asset.safeTransfer(_inceptionVault, amount);

        return amount;
    }
    function _claimPending() private {

        for (uint256 i = 0; i < mellowVaults.length; i++) {

            uint256 amount;
            uint256 numbers;
            uint256 length = IMultiVaultStorage(address(mellowVaults[i])).subvaultsCount();

            uint256[] memory claimableArray = new uint256[](length);
            uint256[] memory subvaultIndices;
            uint256[][] memory indices;

            for (uint256 j = 0; j < length; j++) {

                claimableArray[j] = IWithdrawalQueue(IMultiVaultStorage(address(mellowVaults[i])).subvaultAt(j).withdrawalQueue).claimableAssetsOf(address(this));

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

            IClaimer(claimer).multiAcceptAndClaim(address(mellowVaults[i]), subvaultIndices, indices, address(this), amount);
        }
    }

    function unstakeFromLido() public onlyTrustee returns (uint256[] memory requestIds) {
        uint256 balance = IERC20(wstETH).balanceOf(address(this));
        IERC20(wstETH).safeIncreaseAllowance(withdrawalQueue, balance);
        requestIds = IWithdrawalQueueERC721(withdrawalQueue).requestWithdrawalsWstETH(_makeArray(balance), address(0));
    }

    function claimFromLido() public onlyTrustee {
        uint256[] memory ids = IWithdrawalQueueERC721(withdrawalQueue).getWithdrawalRequests(address(this));
        IWithdrawalQueueERC721.WithdrawalRequestStatus[] memory status = IWithdrawalQueueERC721(withdrawalQueue).getWithdrawalStatus(ids);
        for (uint256 i = 0; i < status.length; i++) {
            if (status[i].isFinalized) IWithdrawalQueueERC721(withdrawalQueue).claimWithdrawal(ids[i]);  // TODO Maybe use claimWithdrawals or claimWithdrawalsOf to avoid unbounded loop
        }
        uint256 ethBalance = address(this).balance;
        if (ethBalance != 0) IWeth(address(_asset)).deposit{ value: ethBalance }();
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

        return IERC4626(address(mellowVault)).previewRedeem(balance);
    }

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

    function inactiveBalance() public view override returns (uint256) {
        return
            pendingWithdrawalAmount() +
            claimableWithdrawalAmount() +
            claimableAmount() +
            pendingWithdrawalLido() + 
            claimableWithdrawalLido();
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

    function setClaimer(address newClaimer) external onlyOwner {
        if (!Address.isContract(newClaimer)) revert NotContract();
        if (newClaimer == address(0)) revert ZeroAddress();

        address oldClaimer = claimer;
        claimer = newClaimer;
        emit ClaimerChanged(oldClaimer, newClaimer);
    }

    function getVersion() external pure override returns (uint256) {
        return 3;
    }

    function _makeArray(uint256 _value) internal view returns (uint256[] memory _array) {
        _array = new uint256[](1);
        _array[0] = _value;
    }
}

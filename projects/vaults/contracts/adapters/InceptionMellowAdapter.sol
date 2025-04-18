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
 * @title The InceptionMellowAdapter Contract
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
            IMellowSymbioticVault(address(mellowVaults[i])).claim(
                address(this),
                address(this),
                type(uint256).max
            );
        }
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

    function claimableWithdrawalAmount() public view returns (uint256 total) {
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            total += IMellowSymbioticVault(address(mellowVaults[i]))
                .claimableAssetsOf(address(this));
        }
    }

    function claimableWithdrawalAmount(
        address _mellowVault
    ) external view returns (uint256) {
        return
            IMellowSymbioticVault(_mellowVault).claimableAssetsOf(
                address(this)
            );
    }

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

    function pendingWithdrawalAmount(
        address _mellowVault
    ) external view returns (uint256) {
        return
            IMellowSymbioticVault(_mellowVault).pendingAssetsOf(address(this));
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

    function setEthWrapper(address newEthWrapper) external onlyOwner {
        if (!Address.isContract(newEthWrapper)) revert NotContract();
        if (newEthWrapper == address(0)) revert ZeroAddress();

        address oldWrapper = ethWrapper;
        ethWrapper = newEthWrapper;
        emit EthWrapperChanged(oldWrapper, newEthWrapper);
    }

    function getVersion() external pure override returns (uint256) {
        return 3;
    }
}

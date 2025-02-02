// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IMellowPriceOracle} from "../interfaces/symbiotic-vault/mellow-core/IMellowPriceOracle.sol";
import {IMellowRatiosOracle} from "../interfaces/symbiotic-vault/mellow-core/IMellowRatiosOracle.sol";

import {IIMellowRestaker, IIEigenRestakerErrors} from "../interfaces/symbiotic-vault/IIMellowRestaker.sol";
import {IMellowDepositWrapper} from "../interfaces/symbiotic-vault/mellow-core/IMellowDepositWrapper.sol";
import {IMellowHandler} from "../interfaces/symbiotic-vault/mellow-core/IMellowHandler.sol";
import {IMellowVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowVault.sol";
import {IDefaultCollateral} from "../interfaces/symbiotic-vault/mellow-core/IMellowDefaultCollateral.sol";
import {FullMath} from "../lib/FullMath.sol";

import {IMellowPriceOracle} from "../interfaces/symbiotic-vault/mellow-core/IMellowPriceOracle.sol";
import {IMellowRatiosOracle} from "../interfaces/symbiotic-vault/mellow-core/IMellowRatiosOracle.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {IEthWrapper} from "../interfaces/symbiotic-vault/mellow-core/IEthWrapper.sol";
import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";

/**
 * @title The MellowRestaker Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the Mellow protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract IMellowRestaker is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    OwnableUpgradeable,
    IIMellowRestaker,
    IIEigenRestakerErrors
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;
    address internal _trusteeManager;
    address internal _vault;

    // If mellowDepositWrapper exists, then mellowVault is active
    mapping(address => IMellowDepositWrapper) public mellowDepositWrappers; // mellowVault => mellowDepositWrapper
    IMellowVault[] public mellowVaults;

    mapping(address => uint256) public allocations;
    uint256 public totalAllocations;

    uint256 public requestDeadline;

    uint256 public depositSlippage; // BasisPoints 10,000 = 100%
    uint256 public withdrawSlippage;

    address public ethWrapper;

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
        IMellowVault[] memory _mellowVault,
        IERC20 asset,
        address trusteeManager
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        __ERC165_init();

        for (uint256 i = 0; i < _mellowVault.length; i++) {
            mellowVaults.push(_mellowVault[i]);
        }
        _asset = asset;
        _trusteeManager = trusteeManager;
    }

    function delegateMellow(
        uint256 amount,
        address mellowVault,
        address referral
    ) external onlyTrustee whenNotPaused returns (uint256 lpAmount) {
        _asset.safeTransferFrom(_vault, address(this), amount);
        IERC20(_asset).safeIncreaseAllowance(address(ethWrapper), amount);
        return IEthWrapper(ethWrapper).deposit(address(_asset), amount, mellowVault, address(this), referral);
    }

    function delegate(
        uint256 amount,
        address referral
    ) external onlyTrustee whenNotPaused returns (uint256 lpAmount) {
        uint256 allocationsTotal = totalAllocations;
        _asset.safeTransferFrom(_vault, address(this), amount);

        for (uint8 i = 0; i < mellowVaults.length; i++) {
            uint256 allocation = allocations[address(mellowVaults[i])];
            if (allocation > 0) {
                uint256 localBalance = (amount * allocation) / allocationsTotal;
                IERC20(_asset).safeIncreaseAllowance(address(ethWrapper), localBalance);
                lpAmount += IEthWrapper(ethWrapper).deposit(address(_asset), localBalance, address(mellowVaults[i]), address(this), referral);

            }
        }

        uint256 left = _asset.balanceOf(address(this));

        if (left != 0) _asset.safeTransfer(_vault, left);
    }

    function withdrawMellow(
        address _mellowVault,
        uint256 amount
    ) external override onlyTrustee whenNotPaused returns (uint256) {

        uint256 balanceState = _asset.balanceOf(address(this));
        IERC4626(_mellowVault).withdraw(amount,address(this), address(this));
        
        return (_asset.balanceOf(address(this)) - balanceState);
    }

    function claimPending() external returns (uint256) {

        for (uint256 i = 0; i < mellowVaults.length; i++) {
            IMellowSymbioticVault(address(mellowVaults[i])).claim(address(this), address(this), type(uint256).max);
        }
    }

    function claimableAmount() external view returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    function claimMellowWithdrawalCallback()
        external
        onlyTrustee
        returns (uint256)
    {
        uint256 amount = _asset.balanceOf(address(this));
        if (amount == 0) revert ValueZero();

        _asset.safeTransfer(_vault, amount);

        return amount;
    }

    function addMellowVault(address mellowVault) external onlyOwner {

        if (mellowVault == address(0)) revert ZeroAddress();

        for (uint8 i = 0; i < mellowVaults.length; i++) {
            if (mellowVault == address(mellowVaults[i])) {
                revert AlreadyAdded();
            }
        }

        mellowVaults.push(IMellowVault(mellowVault));

        emit VaultAdded(mellowVault);
    }
    function setEthWrapper(address newEthWrapper) external onlyOwner {

        if (newEthWrapper == address(0)) revert ZeroAddress();
        
        address oldWrapper = ethWrapper;
        ethWrapper = newEthWrapper;

        emit EthWrapperChanged(oldWrapper, newEthWrapper);
    }
    function changeAllocation(
        address mellowVault,
        uint256 newAllocation
    ) external onlyOwner {
        if (mellowVault == address(0)) revert ZeroAddress();
        uint256 oldAllocation = allocations[mellowVault];
        allocations[mellowVault] = newAllocation;

        totalAllocations = totalAllocations + newAllocation - oldAllocation;

        emit AllocationChanged(mellowVault, oldAllocation, newAllocation);
    }

    function pendingMellowRequest(
        IMellowVault mellowVault
    ) public view override returns (IMellowVault.WithdrawalRequest memory) {
        return mellowVault.withdrawalRequest(address(this));
    }

    function claimableWithdrawalAmount() external view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < mellowVaults.length; i++) {

            total += IMellowSymbioticVault(address(mellowVaults[i])).claimableAssetsOf(address(this));
        }

        return total;
    }

    function claimableWithdrawalAmount(address _mellowVault) external view returns (uint256) {

        return IMellowSymbioticVault(_mellowVault).claimableAssetsOf(address(this));
    }

    function pendingWithdrawalAmount() external view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < mellowVaults.length; i++) {

            total += IMellowSymbioticVault(address(mellowVaults[i])).pendingAssetsOf(address(this));
        }

        return total;
    }

    function pendingWithdrawalAmount(address _mellowVault) external view returns (uint256) {

        return IMellowSymbioticVault(_mellowVault).pendingAssetsOf(address(this));
    }

    function getDeposited(address _mellowVault) public view returns (uint256) {
        IMellowVault mellowVault = IMellowVault(_mellowVault);
        uint256 balance = mellowVault.balanceOf(address(this));
        if (balance == 0) {
            return 0;
        }
        return IERC4626(address(mellowVault)).previewRedeem(balance);
    }

    function getTotalDeposited() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            uint256 balance = mellowVaults[i].balanceOf(address(this));
            if (balance > 0) {
                total += IERC4626(address(mellowVaults[i])).previewRedeem(balance);
            }
        }
        return total;
    }

    function getVersion() external pure returns (uint256) {
        return 1;
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
}

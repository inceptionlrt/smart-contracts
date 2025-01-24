// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IISymbioticRestaker, IIEigenRestakerErrors} from "../interfaces/symbiotic-vault/IISymbioticRestaker.sol";
import {IVault} from "../interfaces/symbiotic-vault/symbiotic-core/IVault.sol";
import {IMellowHandler} from "../interfaces/symbiotic-vault/mellow-core/IMellowHandler.sol";
import {IMellowVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowVault.sol";
import {IDefaultCollateral} from "../interfaces/symbiotic-vault/mellow-core/IMellowDefaultCollateral.sol";
import {FullMath} from "../lib/FullMath.sol";

/**
 * @title The SymbioticRestaker Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the SymbioticFi Protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract ISymbioticRestaker is
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

    // If mellowDepositWrapper exists, then mellowVault is active
    /// TODO
    mapping(address => IVault) public deposits; // symbioticVaukt => mellowDepositWrapper
    IVault[] public vaults;

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
        IVault[] memory _mellowDepositWrapper,
        IMellowVault[] memory _mellowVault,
        IERC20 asset,
        address trusteeManager
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        __ERC165_init();

        if (_mellowDepositWrapper.length != _mellowVault.length)
            revert LengthMismatch();

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

    function delegateToVault(uint256 amount, IVault vault)
        external
        onlyTrustee
        whenNotPaused
        returns (uint256 depositedAmount, uint256 mintedShares)
    {
        // transfer from the vault
        _asset.safeTransferFrom(_vault, address(this), amount);
        // deposit the asset to the appropriate strategy
        IERC20(_asset).safeIncreaseAllowance(address(vault), amount);
        // uint256 minAmount = (amount * (10000 - depositSlippage)) / 10000;
        return vault.deposit(address(this), amount);
    }

    function delegate(uint256 amount, uint256 deadline)
        external
        onlyTrustee
        whenNotPaused
        returns (uint256 tokenAmount, uint256 lpAmount)
    {
        uint256 allocationsTotal = totalAllocations;
        _asset.safeTransferFrom(_vault, address(this), amount);

        for (uint8 i = 0; i < mellowVaults.length; i++) {
            uint256 allocation = allocations[address(mellowVaults[i])];
            if (allocation > 0) {
                uint256 localBalance = (amount * allocation) / allocationsTotal;
                IMellowDepositWrapper wrapper = mellowDepositWrappers[
                    address(mellowVaults[i])
                ];
                IERC20(_asset).safeIncreaseAllowance(
                    address(wrapper),
                    localBalance
                );
                uint256 minAmount = (localBalance * (10000 - depositSlippage)) /
                    10000;
                lpAmount += wrapper.deposit(
                    address(this),
                    address(_asset),
                    localBalance,
                    minAmount,
                    block.timestamp + deadline
                );
            }
        }
        uint256 returned = _asset.balanceOf(address(this));
        tokenAmount = amount - returned;
        IERC20(_asset).safeTransfer(msg.sender, returned);
    }

    function withdrawMellow(
        address _mellowVault,
        uint256 amount,
        uint256 deadline,
        bool closePrevious
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        IMellowVault mellowVault = IMellowVault(_mellowVault);
        uint256 lpAmount = amountToLpAmount(amount, mellowVault);
        uint256[] memory minAmounts = new uint256[](1);
        minAmounts[0] = (amount * (10000 - withdrawSlippage)) / 10000; // slippage

        if (address(mellowDepositWrappers[_mellowVault]) == address(0))
            revert InvalidVault();

        mellowVault.registerWithdrawal(
            address(this),
            lpAmount,
            minAmounts,
            block.timestamp + deadline,
            block.timestamp + requestDeadline,
            closePrevious
        );

        (
            bool isProcessingPossible,
            ,
            uint256[] memory expectedAmounts
        ) = mellowVault.analyzeRequest(
                mellowVault.calculateStack(),
                mellowVault.withdrawalRequest(address(this))
            );

        if (!isProcessingPossible) revert BadMellowWithdrawRequest();
        return expectedAmounts[0];
    }

    // function withdrawEmergencyMellow(
    //     address _mellowVault,
    //     uint256 _deadline
    // ) external override onlyTrustee whenNotPaused returns (uint256) {
    //     IMellowVault mellowVault = IMellowVault(_mellowVault);
    //     address[] memory tokens;
    //     uint256[] memory baseTvlAmounts;
    //     (tokens, baseTvlAmounts) = mellowVault.baseTvl();
    //     uint256 totalSupply = IERC20(_mellowVault).totalSupply();

    //     uint256[] memory minAmounts = new uint256[](baseTvlAmounts.length);
    //     for (uint256 i = 0; i < baseTvlAmounts.length; i++) {
    //         minAmounts[i] = (baseTvlAmounts[i] * pendingMellowRequest(IMellowVault(_mellowVault)).lpAmount / totalSupply) - 1 gwei;
    //     }

    //     if (address(mellowDepositWrappers[_mellowVault]) == address(0)) revert InvalidVault();

    //     uint256[] memory actualAmounts = mellowVault.emergencyWithdraw(minAmounts, block.timestamp + _deadline);

    //     if (actualAmounts[1] > 0) {
    //         IDefaultCollateral(tokens[1]).withdraw(address(this), IERC20(tokens[1]).balanceOf(address(this)));
    //     }

    //     return _asset.balanceOf(address(this));
    // }

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

    function addMellowVault(address mellowVault, address depositWrapper)
        external
        onlyOwner
    {
        if (mellowVault == address(0) || depositWrapper == address(0))
            revert ZeroAddress();
        if (
            address(IMellowDepositWrapper(depositWrapper).vault()) !=
            mellowVault
        ) revert InvalidWrapperForVault();

        for (uint8 i = 0; i < mellowVaults.length; i++) {
            if (mellowVault == address(mellowVaults[i])) {
                revert AlreadyAdded();
            }
        }

        mellowDepositWrappers[mellowVault] = IMellowDepositWrapper(
            depositWrapper
        );
        mellowVaults.push(IMellowVault(mellowVault));

        emit VaultAdded(mellowVault, depositWrapper);
    }

    function changeMellowWrapper(address mellowVault, address newDepositWrapper)
        external
        onlyOwner
    {
        if (mellowVault == address(0) || newDepositWrapper == address(0))
            revert ZeroAddress();
        if (
            address(IMellowDepositWrapper(newDepositWrapper).vault()) !=
            mellowVault
        ) revert InvalidWrapperForVault();

        address oldWrapper = address(mellowDepositWrappers[mellowVault]);
        if (oldWrapper == address(0)) revert NoWrapperExists();

        mellowDepositWrappers[mellowVault] = IMellowDepositWrapper(
            newDepositWrapper
        );

        emit WrapperChanged(mellowVault, oldWrapper, newDepositWrapper);
    }

    function changeAllocation(address mellowVault, uint256 newAllocation)
        external
        onlyOwner
    {
        if (mellowVault == address(0)) revert ZeroAddress();
        uint256 oldAllocation = allocations[mellowVault];
        allocations[mellowVault] = newAllocation;

        totalAllocations = totalAllocations + newAllocation - oldAllocation;

        emit AllocationChanged(mellowVault, oldAllocation, newAllocation);
    }

    function pendingMellowRequest(IMellowVault mellowVault)
        public
        view
        override
        returns (IMellowVault.WithdrawalRequest memory)
    {
        return mellowVault.withdrawalRequest(address(this));
    }

    function pendingSymbioticRequest() public view returns (uint256) {
        return 0;
    }

    function pendingWithdrawalAmount() external view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            IMellowVault.WithdrawalRequest memory request = mellowVaults[i]
                .withdrawalRequest(address(this));
            //  total += lpAmountToAmount(request.lpAmount, mellowVaults[i]);
        }

        return total;
    }

    function getDeposited(address _mellowVault) public view returns (uint256) {
        IMellowVault mellowVault = IMellowVault(_mellowVault);
        uint256 balance = mellowVault.balanceOf(address(this));
        if (balance == 0) {
            return 0;
        }
        return 0;
        // return lpAmountToAmount(balance, mellowVault);
    }

    function getTotalDeposited() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            uint256 balance = mellowVaults[i].balanceOf(address(this));
            if (balance > 0) {
                //   total += lpAmountToAmount(balance, mellowVaults[i]);
            }
        }
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

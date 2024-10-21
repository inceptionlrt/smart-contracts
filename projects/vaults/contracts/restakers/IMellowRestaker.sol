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
import {IWSteth} from "../interfaces/common/IWSteth.sol";
import {FullMath} from "../lib/FullMath.sol";

import {IMellowPriceOracle} from "../interfaces/symbiotic-vault/mellow-core/IMellowPriceOracle.sol";
import {IMellowRatiosOracle} from "../interfaces/symbiotic-vault/mellow-core/IMellowRatiosOracle.sol";

/// @author The InceptionLRT team
/// @title The MellowRestaker Contract
/// @dev Handles delegation and withdrawal requests within the Mellow protocol.
/// @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
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

    address public constant wsteth = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;

    mapping(address => uint256) public allocations;

    uint256 public requestDeadline;

    modifier onlyTrustee() {
        if(msg.sender != _vault && msg.sender != _trusteeManager) 
            revert NotVaultOrTrusteeManager();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        IMellowDepositWrapper[] memory _mellowDepositWrapper,
        IMellowVault[] memory _mellowVault,
        IERC20 asset,
        address trusteeManager
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        __ERC165_init();

        if(_mellowDepositWrapper.length != _mellowVault.length) revert LengthMismatch();

        for (uint256 i = 0; i < _mellowDepositWrapper.length; i++) {
            mellowDepositWrappers[
                address(_mellowVault[i])
            ] = IMellowDepositWrapper(_mellowDepositWrapper[i]);
            mellowVaults.push(_mellowVault[i]);
        }
        _asset = asset;
        _trusteeManager = trusteeManager;

        requestDeadline = 15 days;
    }

    function delegateMellow(
        uint256 amount,
        uint256 minLpAmount,
        uint256 deadline,
        address mellowVault
    ) external onlyTrustee whenNotPaused returns (uint256 lpAmount) {
        IMellowDepositWrapper wrapper = mellowDepositWrappers[mellowVault];
        if(address(wrapper) == address(0)) revert InactiveWrapper();
        // transfer from the vault
        _asset.safeTransferFrom(_vault, address(this), amount);
        // deposit the asset to the appropriate strategy
        IERC20(_asset).safeIncreaseAllowance(address(wrapper), amount);
        return
            wrapper.deposit(
                address(this),
                address(_asset),
                amount,
                minLpAmount,
                deadline
            );
    }

    function delegate(
        uint256 deadline
    ) external onlyTrustee whenNotPaused returns (uint256 amount, uint256 lpAmount) {
        uint256 MAX_TARGET_PERCENT = IMellowHandler(_vault)
            .MAX_TARGET_PERCENT();
        uint256 total = IMellowHandler(_vault).getTotalDeposited();
        for (uint8 i = 0; i < mellowVaults.length; i++) {
            uint256 allocation = allocations[address(mellowVaults[i])]; // in %
            if (allocation > 0) {
                uint256 bal = getDeposited(address(mellowVaults[i]));
                if ((bal * MAX_TARGET_PERCENT) / total < allocation) {
                    bal = ((total * allocation) / MAX_TARGET_PERCENT) - bal;
                    if (
                        IMellowHandler(_vault).getFreeBalance() >= bal &&
                        bal > 0
                    ) {
                        _asset.safeTransferFrom(_vault, address(this), bal);
                        IMellowDepositWrapper wrapper = mellowDepositWrappers[
                            address(mellowVaults[i])
                        ];
                        IERC20(_asset).safeIncreaseAllowance(
                            address(wrapper),
                            bal
                        );
                        lpAmount += wrapper.deposit(
                            address(this),
                            address(_asset),
                            bal,
                            0,
                            deadline
                        );
                        amount += bal;
                    }
                }
            }
        }
    }

    function withdrawMellow(
        address _mellowVault,
        uint256 amount,
        bool closePrevious
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        IMellowVault mellowVault = IMellowVault(_mellowVault);
        amount = IWSteth(wsteth).getWstETHByStETH(amount);
        uint256 lpAmount = amountToLpAmount(amount, mellowVault);
        uint256[] memory minAmounts = new uint256[](1);
        minAmounts[0] = amount - 5; // dust

        if (address(mellowDepositWrappers[_mellowVault]) == address(0)) revert InvalidVault();

        mellowVault.registerWithdrawal(
            address(this),
            lpAmount,
            minAmounts,
            block.timestamp + 15 days,
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
        return IWSteth(wsteth).getStETHByWstETH(expectedAmounts[0]);
    }

    function withdrawEmergencyMellow(
        address _mellowVault,
        uint256 amount
    ) external override onlyTrustee whenNotPaused returns(uint256) {
        IMellowVault mellowVault = IMellowVault(_mellowVault);
        amount = IWSteth(wsteth).getWstETHByStETH(amount);
        uint256[] memory minAmounts = new uint256[](2);
        minAmounts[0] = amount - 5; // dust

        if (address(mellowDepositWrappers[_mellowVault]) == address(0)) revert InvalidVault();

        uint256[] memory actualAmounts = mellowVault.emergencyWithdraw(
            minAmounts,
            block.timestamp + 15 days
        );

        uint256 actualAmount;
        if (actualAmounts.length > 0) actualAmount = actualAmounts[0];
        return IWSteth(wsteth).getStETHByWstETH(actualAmount);
    }

    function claimableAmount() external view returns (uint256) {
        return
            IWSteth(wsteth).getStETHByWstETH(
                IERC20(wsteth).balanceOf(address(this))
            );
    }

    function claimMellowWithdrawalCallback()
        external
        onlyTrustee
        returns (uint256)
    {
        uint256 amount = IERC20(wsteth).balanceOf(address(this));
        if (amount == 0) revert ValueZero();

        amount = _unwrap(amount);
        _asset.safeTransfer(_vault, amount);

        return amount;
    }

    function changeAllocation(
        address mellowVault,
        uint256 newAllocation
    ) external onlyOwner {
        if (mellowVault == address(0)) revert ZeroAddress();
        uint256 oldAllocation = allocations[mellowVault];
        allocations[mellowVault] = newAllocation;
        if (!_isValidAllocation()) revert InvalidAllocation();

        emit AllocationChanged(mellowVault, oldAllocation, newAllocation);
    }

    function _isValidAllocation() private view returns (bool) {
        uint256 totalAllocations;
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            totalAllocations += allocations[address(mellowVaults[i])];
        }
        totalAllocations += IMellowHandler(_vault).targetCapacity();
        return totalAllocations <= IMellowHandler(_vault).MAX_TARGET_PERCENT();
    }

    function pendingMellowRequest(
        IMellowVault mellowVault
    ) external view override returns (IMellowVault.WithdrawalRequest memory) {
        return mellowVault.withdrawalRequest(address(this));
    }

    function pendingWithdrawalAmount() external view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            IMellowVault.WithdrawalRequest memory request = mellowVaults[i]
                .withdrawalRequest(address(this));
            total += lpAmountToAmount(request.lpAmount, mellowVaults[i]);
        }

        return total;
    }

    function getDeposited(address _mellowVault) public view returns (uint256) {
        IMellowVault mellowVault = IMellowVault(_mellowVault);
        uint256 balance = mellowVault.balanceOf(address(this));
        return lpAmountToAmount(balance, mellowVault);
    }

    function getTotalDeposited() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < mellowVaults.length; i++) {
            uint256 balance = mellowVaults[i].balanceOf(address(this));
            total += lpAmountToAmount(balance, mellowVaults[i]);
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
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        (address[] memory tokens, uint256[] memory totalAmounts) = mellowVault
            .underlyingTvl();

        uint128[] memory ratiosX96 = IMellowRatiosOracle(
            mellowVault.configurator().ratiosOracle()
        ).getTargetRatiosX96(address(mellowVault), true);

        uint256 ratioX96 = type(uint256).max;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (ratiosX96[i] == 0) continue;
            uint256 ratioX96_ = FullMath.mulDiv(
                amounts[i],
                mellowVault.Q96(),
                ratiosX96[i]
            );
            if (ratioX96_ < ratioX96) ratioX96 = ratioX96_;
        }
        if (ratioX96 == 0) revert ValueZero();

        uint256 depositValue = 0;
        uint256 totalValue = 0;
        {
            IMellowPriceOracle priceOracle = IMellowPriceOracle(
                mellowVault.configurator().priceOracle()
            );
            for (uint256 i = 0; i < tokens.length; i++) {
                uint256 priceX96 = priceOracle.priceX96(
                    address(mellowVault),
                    tokens[i]
                );
                totalValue += totalAmounts[i] == 0
                    ? 0
                    : FullMath.mulDivRoundingUp(
                        totalAmounts[i],
                        priceX96,
                        mellowVault.Q96()
                    );

                if (ratiosX96[i] == 0) continue;

                amount = FullMath.mulDiv(
                    ratioX96,
                    ratiosX96[i],
                    mellowVault.Q96()
                );
                depositValue += FullMath.mulDiv(
                    amount,
                    priceX96,
                    mellowVault.Q96()
                );
            }
        }

        uint256 totalSupply = mellowVault.totalSupply();
        lpAmount = FullMath.mulDiv(depositValue, totalSupply, totalValue);
    }

    function lpAmountToAmount(
        uint256 lpAmount,
        IMellowVault mellowVault
    ) public view returns (uint256) {
        IMellowVault.ProcessWithdrawalsStack memory s = mellowVault
            .calculateStack();
        uint256 wstEthAmount = FullMath.mulDiv(
            FullMath.mulDiv(lpAmount, s.totalValue, s.totalSupply),
            s.ratiosX96[0],
            s.ratiosX96Value
        );
        return IWSteth(wsteth).getStETHByWstETH(wstEthAmount);
    }

    function _unwrap(
        uint256 wrappedAmount
    ) private returns (uint256 baseAmount) {
        IWSteth(wsteth).unwrap(wrappedAmount);
        return IERC20(_asset).balanceOf(address(this));
    }

    function setVault(address vault) external onlyOwner {
        _vault = vault;
    }

    function setRequestDeadline(uint256 _days) external onlyOwner {
        requestDeadline = _days * 1 days;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

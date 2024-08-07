// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "hardhat/console.sol";

import "../vaults/InceptionVault.sol";
import "../interfaces/InceptionRestakerErrors.sol";
import "../interfaces/IDelegationManager.sol";
import "../interfaces/IMellowRestaker.sol";
import "../interfaces/IMellowDepositWrapper.sol";
import "../interfaces/IMellowVault.sol";
import "../interfaces/IWSteth.sol";
import "../interfaces/IMellowVaultConfigurator.sol";
import "../lib/FullMath.sol";

import "../interfaces/mellow/IMellowPriceOracle.sol";
import "../interfaces/mellow/IMellowRatiosOracle.sol";

/// @author The InceptionLRT team
/// @title The MellowRestaker Contract
/// @dev Handles delegation and withdrawal requests within the Mellow protocol.
/// @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
contract MellowRestaker is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    OwnableUpgradeable,
    IMellowRestaker,
    InceptionRestakerErrors
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;
    address internal _trusteeManager;
    address internal _vault;

    IMellowDepositWrapper mellowDepositWrapper;
    IMellowVault mellowVault;

    address public constant wsteth = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;

    modifier onlyTrustee() {
        require(
            msg.sender == _vault || msg.sender == _trusteeManager,
            "InceptionRestaker: only vault or trustee manager"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IMellowDepositWrapper _mellowDepositWrapper,
        IMellowVault _mellowVault,
        IERC20 asset,
        address trusteeManager
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        // Ensure compatibility with future versions of ERC165Upgradeable
        __ERC165_init();

        mellowDepositWrapper = _mellowDepositWrapper;
        mellowVault = _mellowVault;
        _asset = asset;
        _trusteeManager = trusteeManager;
    }

    function delegateMellow(
        uint256 amount,
        uint256 minLpAmount,
        uint256 deadline
    ) external onlyTrustee returns (uint256 lpAmount) {
        // transfer from the vault
        _asset.transferFrom(_vault, address(this), amount);
        // deposit the asset to the appropriate strategy
        IERC20(_asset).safeIncreaseAllowance(
            address(mellowDepositWrapper),
            amount
        );
        return
            mellowDepositWrapper.deposit(
                address(this),
                address(_asset),
                amount,
                minLpAmount,
                deadline
            );
    }

    function withdrawMellow(
        uint256 amount,
        bool closeProvious
    ) external override onlyTrustee returns (uint256) {
        amount = IWSteth(wsteth).getWstETHByStETH(amount);
        uint256 lpAmount = _amountToLpAmount(amount);
        uint256[] memory minAmounts = new uint256[](1);
        minAmounts[0] = amount - 2; // dust

        mellowVault.registerWithdrawal(
            address(this),
            lpAmount,
            minAmounts,
            block.timestamp + 15 days,
            block.timestamp + 15 days,
            closeProvious
        );

        (
            bool isProcessingPossible,
            bool isWithdrawalPossible,
            uint256[] memory expectedAmounts
        ) = mellowVault.analyzeRequest(
                mellowVault.calculateStack(),
                mellowVault.withdrawalRequest(address(this))
            );

        if (!isProcessingPossible) revert BadMellowWithdrawRequest();

        return IWSteth(wsteth).getStETHByWstETH(expectedAmounts[0]);
    }

    function claimMellowWithdrawalCallback(
        uint256 amount
    ) external onlyTrustee returns (uint256) {
        amount = IWSteth(wsteth).getWstETHByStETH(amount);
        uint256 balanceBefore = _asset.balanceOf(address(_vault));

        amount = _unwrap(amount);
        if (!_asset.transfer(_vault, amount)) {
            revert TransferAssetFailed(address(_asset));
        }
        uint256 withdrawnAmount = _asset.balanceOf(address(_vault)) -
            balanceBefore;
        return withdrawnAmount;
    }

    function pendingMellowRequest()
        external
        view
        override
        returns (IMellowVault.WithdrawalRequest memory)
    {
        return mellowVault.withdrawalRequest(address(this));
    }

    function getDeposited() external view returns (uint256) {
        // IMellowVault.ProcessWithdrawalsStack memory s = mellowVault.calculateStack();
        return IWSteth(wsteth).getStETHByWstETH(
          // _lpAmountToAmount(mellowVault.balanceOf(address(this)), s.totalValue)
          mellowVault.balanceOf(address(this))
        );
    }

    function getVersion() external pure returns (uint256) {
        return 1;
    }

    function _amountToLpAmount(
        uint256 amount
    ) private returns (uint256 lpAmount) {
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

    function _lpAmountToAmount(
        uint256 lpAmount,
        uint256 totalValue
    ) private view returns (uint256 amount) {
        (address[] memory tokens, uint256[] memory totalAmounts) = mellowVault
            .underlyingTvl();

        uint128[] memory ratiosX96 = IMellowRatiosOracle(
            mellowVault.configurator().ratiosOracle()
        ).getTargetRatiosX96(address(mellowVault), true);

        uint256 value = FullMath.mulDiv(
            lpAmount,
            totalValue,
            mellowVault.totalSupply()
        );

        IMellowPriceOracle priceOracle = IMellowPriceOracle(
            mellowVault.configurator().priceOracle()
        );

        uint256 totalAmountValueX96 = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (ratiosX96[i] == 0) continue;
            
            uint256 priceX96 = priceOracle.priceX96(address(mellowVault), tokens[i]);
            uint256 tokenValue = FullMath.mulDivRoundingUp(
                totalAmounts[i],
                priceX96,
                mellowVault.Q96()
            );
            totalAmountValueX96 += tokenValue;
        }

        // Calculate the amount corresponding to the given lpAmount
        for (uint256 i = 0; i < tokens.length; i++) {
            if (ratiosX96[i] == 0) continue;

            uint256 priceX96 = priceOracle.priceX96(address(mellowVault), tokens[i]);

            uint256 amountValueX96 = FullMath.mulDiv(value, ratiosX96[i], totalAmountValueX96);

            amount = FullMath.mulDiv(amountValueX96, mellowVault.Q96(), priceX96);
        }
        amount = FullMath.mulDiv(amount, 1, 1e6);
        return amount;
    }

    function _unwrap(uint256 wrappedAmount) private returns (uint256 baseAmount) {
        IWSteth(wsteth).unwrap(wrappedAmount);
        return IERC20(_asset).balanceOf(address(this));
    }

    function setVault(address vault) external onlyOwner {
        _vault = vault;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
        _vault = msg.sender;

        // approve spending by deposit wrapper
        _asset.approve(address(mellowDepositWrapper), type(uint256).max);
    }

    function delegateMellow(
        uint256 amount,
        uint256 minLpAmount,
        uint256 deadline
    ) external onlyTrustee returns (uint256 lpAmount) {
        // transfer from the vault
        _asset.transferFrom(_vault, address(this), amount);
        // deposit the asset to the appropriate strategy
        return mellowDepositWrapper.deposit(address(this), address(_asset), amount, minLpAmount, deadline, 0);
    }

    function withdrawMellow(
        uint256 amount,
        bool closeProvious
    ) external onlyTrustee override returns (uint256){
        uint256 lpAmount = _amountToLpAmount(amount);
        uint256[] memory minAmounts = new uint256[](2);
        minAmounts[0] = amount;

        mellowVault.registerWithdrawal(address(this), lpAmount, minAmounts, block.timestamp + 15 days, block.timestamp + 15 days, closeProvious);

        (
            bool isProcessingPossible,
            bool isWithdrawalPossible,
            uint256[] memory expectedAmounts
        ) = mellowVault.analyzeRequest(
          mellowVault.calculateStack(),
          mellowVault.withdrawalRequest(address(this))
        );

        if (!isProcessingPossible)
            revert BadMellowWithdrawRequest();

        return expectedAmounts[0];
    }

    function claimMellowWithdrawalCallback(uint256 amount) external onlyTrustee returns (uint256) {
        uint256 balanceBefore = _asset.balanceOf(address(_vault));

        _wstethToSteth(amount);
        if (!_asset.transfer(_vault, amount)) {
            revert TransferAssetFailed(address(_asset));
        }
        uint256 withdrawnAmount = _asset.balanceOf(address(_vault)) -
            balanceBefore;
        return withdrawnAmount;
    }

    function pendingMellowRequest() external view override returns (IMellowVault.WithdrawalRequest memory) {
      return mellowVault.withdrawalRequest(address(this));
    }

    function getVersion() external pure returns (uint256) {
        return 1;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _amountToLpAmount(uint256 amount) private returns (uint256 lpAmount) {
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        (
            address[] memory tokens,
            uint256[] memory totalAmounts
        ) = mellowVault.underlyingTvl();

        uint128[] memory ratiosX96 = IMellowRatiosOracle(mellowVault.configurator().ratiosOracle())
            .getTargetRatiosX96(address(mellowVault), true);

        uint256 ratioX96 = type(uint256).max;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (ratiosX96[i] == 0) continue;
            uint256 ratioX96_ = FullMath.mulDiv(amounts[i], mellowVault.Q96(), ratiosX96[i]);
            if (ratioX96_ < ratioX96) ratioX96 = ratioX96_;
        }
        if (ratioX96 == 0) revert ValueZero();

        uint256 depositValue = 0;
        uint256 totalValue = 0;
        {
            IMellowPriceOracle priceOracle = IMellowPriceOracle(mellowVault.configurator().priceOracle());
            for (uint256 i = 0; i < tokens.length; i++) {
                uint256 priceX96 = priceOracle.priceX96(
                    address(mellowVault),
                    tokens[i]
                );
                totalValue += totalAmounts[i] == 0
                    ? 0
                    : FullMath.mulDivRoundingUp(totalAmounts[i], priceX96, mellowVault.Q96());

                if (ratiosX96[i] == 0) continue;

                amount = FullMath.mulDiv(ratioX96, ratiosX96[i], mellowVault.Q96());
                depositValue += FullMath.mulDiv(amount, priceX96, mellowVault.Q96());
            }
        }

        uint256 totalSupply = mellowVault.totalSupply();
        lpAmount = FullMath.mulDiv(depositValue, totalSupply, totalValue);
    }

    function _wstethToSteth(uint256 amount) private {
        uint256 wstethBalance = IERC20(wsteth).balanceOf(address(this));
        if (wstethBalance < amount) 
          revert NotEnoughBalance();

        IWSteth(wsteth).unwrap(amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {InceptionRestakerErrors} from "../interfaces/InceptionRestakerErrors.sol";
import {IWSteth} from "../interfaces/IWSteth.sol";

import {FullMath} from "../lib/FullMath.sol";

import {ISymbioticVault} from "../interfaces/symbiotic/ISymbioticVault.sol";
import {ISymbioticRestaker} from "../interfaces/ISymbioticRestaker.sol";

/// @author The InceptionLRT team
/// @title The MellowRestaker Contract
/// @dev Handles delegation and withdrawal requests within the Mellow protocol.
/// @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
contract SymbioticRestaker is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    OwnableUpgradeable,
    InceptionRestakerErrors,
    ISymbioticRestaker
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;
    address internal _trusteeManager;
    address internal _vault;

    ISymbioticVault public symbioticVault;

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
        ISymbioticVault _symbioticVault,
        IERC20 asset,
        address trusteeManager
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        // Ensure compatibility with future versions of ERC165Upgradeable
        __ERC165_init();

        symbioticVault = _symbioticVault;
        _asset = asset;
        _trusteeManager = trusteeManager;
    }

    function delegate(
        uint256 amount
    ) external onlyTrustee returns (uint256 lpAmount) {
        // transfer from the vault
        // _asset.transferFrom(_vault, address(this), amount);
        // // deposit the asset to the appropriate strategy
        // IERC20(_asset).safeIncreaseAllowance(
        //     address(mellowDepositWrapper),
        //     amount
        // );
        //   _beforeDeposit(amount);

        symbioticVault.deposit(address(this), amount);

        // emit IEigenLayerHandler.DelegatedTo(
        //     address(0),
        //     address(mellowRestaker),
        //     amount
        // );
    }

    function withdraw(
        uint256 amount,
        bool closePrevious
    ) external onlyTrustee returns (uint256) {
        //  amount = IWSteth(wsteth).getWstETHByStETH(amount);
        uint256 lpAmount = amountToLpAmount(amount);
        uint256[] memory minAmounts = new uint256[](1);
        minAmounts[0] = amount - 5; // dust

        //  return IWSteth(wsteth).getStETHByWstETH(expectedAmounts[0]);
    }

    // function pendingMellowRequest()
    //     external
    //     view
    //     override
    //     returns (IMellowVault.WithdrawalRequest memory)
    // {
    //     return mellowVault.withdrawalRequest(address(this));
    // }

    function pendingWithdrawalAmount() external view returns (uint256) {
        // IMellowVault.WithdrawalRequest memory request = mellowVault
        //     .withdrawalRequest(address(this));
        //  return lpAmountToAmount(request.lpAmount);
    }

    function getDeposited() external view returns (uint256) {
        uint256 balance = symbioticVault.activeBalanceOf(address(this));
        return lpAmountToAmount(balance);
    }

    function amountToLpAmount(
        uint256 amount
    ) public view returns (uint256 lpAmount) {}

    function lpAmountToAmount(uint256 lpAmount) public view returns (uint256) {}

    function _unwrap(
        uint256 wrappedAmount
    ) private returns (uint256 baseAmount) {
        //    IWSteth(wsteth).unwrap(wrappedAmount);
        return IERC20(_asset).balanceOf(address(this));
    }

    function setVault(address vault) external onlyOwner {
        _vault = vault;
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
}

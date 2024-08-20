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

import "hardhat/console.sol";

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

    uint256 public currentEpoch;

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
    ) external onlyTrustee returns (uint256 resultAmount) {
        // transfer from the vault
        _asset.transferFrom(_vault, address(this), amount);
        IERC20(_asset).safeIncreaseAllowance(address(symbioticVault), amount);

        console.log("amount to deposit: ", amount);
        symbioticVault.deposit(address(this), amount);
        console.log("deposited: ", this.getDeposited());

        // emit IEigenLayerHandler.DelegatedTo(
        //     address(0),
        //     address(mellowRestaker),
        //     amount
        // );
    }

    function undelegate(uint256 amount) external onlyTrustee {
        if (pendingWithdrawalAmount() != 0) revert PendingWithdrawal();

        currentEpoch = symbioticVault.currentEpoch() + 1;
        symbioticVault.withdraw(address(this), amount);
    }

    function claim() external onlyTrustee {
        symbioticVault.claim(_vault, currentEpoch);
    }

    function pendingWithdrawalAmount() public view returns (uint256) {
        return symbioticVault.withdrawalsOf(currentEpoch, address(this));
    }

    function getDeposited() external view returns (uint256) {
        return symbioticVault.activeBalanceOf(address(this));
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

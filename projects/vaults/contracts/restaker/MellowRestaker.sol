// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/InceptionRestakerErrors.sol";
import "../interfaces/IDelegationManager.sol";
import "../interfaces/IMellowRestaker.sol";
import "../interfaces/IMellowDepositWrapper.sol";
import "../interfaces/IMellowVault.sol";

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
        uint256 lpAmount,
        uint256 minAmount,
        uint256 deadline,
        uint256 requestDeadline,
        bool closeProvious
    ) external onlyTrustee override {
        uint256[] memory minAmounts = new uint256[](2);
        minAmounts[0] = minAmount;
        minAmounts[1] = 0;

        mellowVault.registerWithdrawal(address(this), lpAmount, minAmounts, deadline, requestDeadline, closeProvious);
    }

    function claimMellowWithdrawalCallback(uint256 amount) external onlyTrustee {
        if (!_asset.transfer(_vault, amount)) {
            revert TransferAssetFailed(address(_asset));
        }
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
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";

import "../../interfaces/InceptionStakerErrors.sol";
import "../../interfaces/IDelegationManager.sol";
import "../../interfaces/IInceptionStaker.sol";
import "../../interfaces/IStrategy.sol";
import "../../interfaces/IStrategyManager.sol";

/// @author The InceptionLRT team
/// @title The InceptionStaker Contract
/// @dev Handles delegation and withdrawal requests within the EigenLayer protocol.
/// @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
contract InceptionStaker is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    OwnableUpgradeable,
    IInceptionStaker,
    InceptionStakerErrors
{
    IERC20 internal _asset;
    address internal _trusteeManager;
    address internal _vault;

    IStrategy internal _strategy;
    IStrategyManager internal _strategyManager;
    IDelegationManager internal _delegationManager;

    modifier onlyTrustee() {
        require(
            msg.sender == _vault || msg.sender == _trusteeManager,
            "InceptionStaker: only vault or trustee manager"
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address delegationManager,
        address strategyManager,
        address strategy,
        address trusteeManager
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();

        _delegationManager = IDelegationManager(delegationManager);
        _strategyManager = IStrategyManager(strategyManager);
        _strategy = IStrategy(strategy);
        _asset = _strategy.underlyingToken();
        _trusteeManager = trusteeManager;
        _vault = msg.sender;

        // approve spending by stategyManager
        _asset.approve(strategyManager, type(uint256).max);
    }

    function depositAssetIntoStrategy(uint256 amount) external onlyTrustee {
        // transfer from the vault
        _asset.transferFrom(_vault, address(this), amount);
        // deposit the asset to the appropriate strategy
        _strategyManager.depositIntoStrategy(_strategy, _asset, amount);
    }

    function delegateToOperator(
        address operator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) external onlyTrustee {
        if (operator == address(0)) {
            revert NullParams();
        }

        _delegationManager.delegateTo(
            operator,
            approverSignatureAndExpiry,
            approverSalt
        );
    }

    function withdrawFromEL(uint256 shares) external onlyTrustee {
        uint256[] memory sharesToWithdraw = new uint256[](1);
        IStrategy[] memory strategies = new IStrategy[](1);

        strategies[0] = _strategy;
        sharesToWithdraw[0] = shares;

        IDelegationManager.QueuedWithdrawalParams[]
            memory withdrawals = new IDelegationManager.QueuedWithdrawalParams[](
                1
            );
        withdrawals[0] = IDelegationManager.QueuedWithdrawalParams({
            strategies: strategies,
            shares: sharesToWithdraw,
            withdrawer: _vault
        });

        _delegationManager.queueWithdrawals(withdrawals);
    }

    function getOperatorAddress() public view returns (address) {
        return _delegationManager.delegatedTo(address(this));
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

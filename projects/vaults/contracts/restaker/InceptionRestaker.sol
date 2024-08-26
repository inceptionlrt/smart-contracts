// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {InceptionRestakerErrors} from "../interfaces/InceptionRestakerErrors.sol";
import {IDelegationManager} from "../interfaces/IDelegationManager.sol";
import {IInceptionRestaker} from "../interfaces/IInceptionRestaker.sol";
import {IStrategy} from "../interfaces/IStrategy.sol";
import {IStrategyManager} from "../interfaces/IStrategyManager.sol";
import {IRewardsCoordinator} from "../interfaces/IRewardsCoordinator.sol";

/// @author The InceptionLRT team
/// @title The InceptionRestaker Contract
/// @dev Handles delegation and withdrawal requests within the EigenLayer protocol.
/// @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
contract InceptionRestaker is
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC165Upgradeable,
    OwnableUpgradeable,
    IInceptionRestaker,
    InceptionRestakerErrors
{
    IERC20 internal _asset;
    address internal _trusteeManager;
    address internal _vault;

    IStrategy internal _strategy;
    IStrategyManager internal _strategyManager;
    IDelegationManager internal _delegationManager;
    IRewardsCoordinator internal _rewardCoordinator;

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
        address delegationManager,
        address strategyManager,
        address strategy,
        address trusteeManager
    ) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init();
        // Ensure compatibility with future versions of ERC165Upgradeable
        __ERC165_init();

        _delegationManager = IDelegationManager(delegationManager);
        _strategyManager = IStrategyManager(strategyManager);
        _strategy = IStrategy(strategy);
        _asset = _strategy.underlyingToken();
        _trusteeManager = trusteeManager;
        _vault = msg.sender;

        // approve spending by strategyManager
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
            withdrawer: address(this)
        });

        _delegationManager.queueWithdrawals(withdrawals);
    }

    function claimWithdrawals(
        IDelegationManager.Withdrawal[] calldata withdrawals,
        IERC20[][] calldata tokens,
        uint256[] calldata middlewareTimesIndexes,
        bool[] calldata receiveAsTokens
    ) external onlyTrustee returns (uint256) {
        IERC20 asset = _strategy.underlyingToken();
        uint256 balanceBefore = asset.balanceOf(address(this));

        _delegationManager.completeQueuedWithdrawals(
            withdrawals,
            tokens,
            middlewareTimesIndexes,
            receiveAsTokens
        );

        // send tokens to the vault
        uint256 withdrawnAmount = asset.balanceOf(address(this)) -
            balanceBefore;

        if (!asset.transfer(_vault, withdrawnAmount)) {
            revert TransferAssetFailed(address(asset));
        }

        return withdrawnAmount;
    }

    function getOperatorAddress() public view returns (address) {
        return _delegationManager.delegatedTo(address(this));
    }

    function setRewardCoordinator(
        IRewardsCoordinator newRewardCoordinator
    ) external onlyOwner {
        newRewardCoordinator.setClaimerFor(owner());

        emit RewardCoordinatorChanged(
            address(_rewardCoordinator),
            address(newRewardCoordinator)
        );

        _rewardCoordinator = newRewardCoordinator;
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

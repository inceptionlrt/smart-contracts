// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IInceptionEigenRestaker, IInceptionEigenRestakerErrors} from "../interfaces/eigenlayer-vault/IInceptionEigenRestaker.sol";
import {IDelegationManager, IDelegationManagerTypes} from "../interfaces/eigenlayer-vault/eigen-core/IDelegationManager.sol";
import {IStrategy} from "../interfaces/eigenlayer-vault/eigen-core/IStrategy.sol";
import {IStrategyManager} from "../interfaces/eigenlayer-vault/eigen-core/IStrategyManager.sol";
import {IRewardsCoordinator} from "../interfaces/eigenlayer-vault/eigen-core/IRewardsCoordinator.sol";

/**
 * @title The InceptionEigenRestaker Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the EigenLayer protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract InceptionEigenRestaker is
PausableUpgradeable,
ReentrancyGuardUpgradeable,
ERC165Upgradeable,
OwnableUpgradeable,
IInceptionEigenRestaker,
IInceptionEigenRestakerErrors
{
    using SafeERC20 for IERC20;

    IERC20 internal _asset;
    address internal _trusteeManager;
    address internal _vault;

    IStrategy internal _strategy;
    IStrategyManager internal _strategyManager;
    IDelegationManager internal _delegationManager;
    IRewardsCoordinator public rewardsCoordinator;

    modifier onlyTrustee() {
        if (msg.sender != _vault && msg.sender != _trusteeManager)
            revert OnlyTrusteeAllowed();

        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        address ownerAddress,
        address rewardCoordinator,
        address delegationManager,
        address strategyManager,
        address strategy,
        address asset,
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
        _asset = IERC20(asset);
        _trusteeManager = trusteeManager;
        _vault = msg.sender;
        _setRewardsCoordinator(rewardCoordinator, ownerAddress);

        // approve spending by strategyManager
        _asset.approve(strategyManager, type(uint256).max);
    }

    function depositAssetIntoStrategy(uint256 amount) external onlyTrustee {
        // transfer from the vault
        _asset.safeTransferFrom(_vault, address(this), amount);
        // deposit the asset to the appropriate strategy
        _strategyManager.depositIntoStrategy(_strategy, _asset, amount);
    }

    function delegateToOperator(
        address operator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) external onlyTrustee {
        if (operator == address(0)) revert NullParams();

        _delegationManager.delegateTo(
            operator,
            approverSignatureAndExpiry,
            approverSalt
        );
    }

    function redelegateToOperator(
        address newOperator,
        IDelegationManager.SignatureWithExpiry memory newOperatorApproverSig,
        bytes32 approverSalt
    ) external onlyTrustee {
        if (newOperator == address(0)) revert NullParams();

        _delegationManager.redelegate(
            newOperator,
            newOperatorApproverSig,
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
        IDelegationManagerTypes.Withdrawal[] calldata withdrawals,
        IERC20[][] calldata tokens,
        bool[] calldata receiveAsTokens
    ) external onlyTrustee returns (uint256) {
        uint256 balanceBefore = _asset.balanceOf(address(this));

        _delegationManager.completeQueuedWithdrawals(
            withdrawals,
            tokens,
            receiveAsTokens
        );

        // send tokens to the vault
        uint256 withdrawnAmount = _asset.balanceOf(address(this)) -
                    balanceBefore;

        _asset.safeTransfer(_vault, withdrawnAmount);

        return withdrawnAmount;
    }

    function getOperatorAddress() public view returns (address) {
        return _delegationManager.delegatedTo(address(this));
    }

    function getVersion() external pure returns (uint256) {
        return 2;
    }

    function setRewardsCoordinator(address newRewardsCoordinator)
    external
    onlyOwner
    {
        _setRewardsCoordinator(newRewardsCoordinator, owner());
    }

    function _setRewardsCoordinator(
        address newRewardsCoordinator,
        address ownerAddress
    ) internal {
        IRewardsCoordinator(newRewardsCoordinator).setClaimerFor(ownerAddress);

        emit RewardCoordinatorChanged(
            address(rewardsCoordinator),
            newRewardsCoordinator
        );

        rewardsCoordinator = IRewardsCoordinator(newRewardsCoordinator);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

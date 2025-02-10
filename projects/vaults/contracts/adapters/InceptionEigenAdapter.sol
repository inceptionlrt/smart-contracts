// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {ERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IIEigenLayerAdapter} from "../interfaces/adapters/IIEigenLayerAdapter.sol";
import {IDelegationManager} from "../interfaces/eigenlayer-vault/eigen-core/IDelegationManager.sol";
import {IStrategy} from "../interfaces/eigenlayer-vault/eigen-core/IStrategy.sol";
import {IStrategyManager} from "../interfaces/eigenlayer-vault/eigen-core/IStrategyManager.sol";
import {IRewardsCoordinator} from "../interfaces/eigenlayer-vault/eigen-core/IRewardsCoordinator.sol";

import {IBaseAdapter, IIBaseAdapter} from "./IBaseAdapter.sol";

/**
 * @title The InceptionEigenAdapter Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the EigenLayer protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract InceptionEigenAdapter is
    IIEigenLayerAdapter,
    IBaseAdapter
{
    using SafeERC20 for IERC20;

    IStrategy internal _strategy;
    IStrategyManager internal _strategyManager;
    IDelegationManager internal _delegationManager;
    IRewardsCoordinator public rewardsCoordinator;

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
        __IBaseAdapter_init(IERC20(asset), trusteeManager);

        _delegationManager = IDelegationManager(delegationManager);
        _strategyManager = IStrategyManager(strategyManager);
        _strategy = IStrategy(strategy);
        _inceptionVault = msg.sender;
        _setRewardsCoordinator(rewardCoordinator, ownerAddress);

        // approve spending by strategyManager
        _asset.approve(strategyManager, type(uint256).max);
    }

    function delegate(
        address operator,
        uint256 amount,
        bytes[] calldata _data
    ) external override onlyTrustee returns (uint256) {
        /// 1. delegate or depositIntoStrategy
        if (amount > 0 && operator == address(0)) {
            // transfer from the vault
            _asset.safeTransferFrom(_inceptionVault, address(this), amount);
            // deposit the asset to the appropriate strategy
            return
                _strategyManager.depositIntoStrategy(_strategy, _asset, amount);
        }
        require(operator != address(0), NullParams());
        require(_data.length == 2, InvalidDataLength(4, _data.length));
        bytes32 approverSalt = abi.decode(_data[0], (bytes32));
        IDelegationManager.SignatureWithExpiry
            memory approverSignatureAndExpiry = abi.decode(
                _data[1],
                (IDelegationManager.SignatureWithExpiry)
            );

        _delegationManager.delegateTo(
            operator,
            approverSignatureAndExpiry,
            approverSalt
        );
        return 0;
    }

    function withdraw(
        address, /*vault*/
        uint256 shares,
        bytes[] calldata _data
    ) external override onlyTrustee returns (uint256) {
        require(_data.length == 0, InvalidDataLength(0, _data.length));

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

    function claim(bytes[] calldata _data)
        external
        override
        onlyTrustee
        returns (uint256)
    {
        uint256 balanceBefore = _asset.balanceOf(address(this));

        IDelegationManager.Withdrawal[] memory withdrawals = abi.decode(
            _data[0],
            (IDelegationManager.Withdrawal[])
        );
        IERC20[][] memory tokens = abi.decode(_data[1], (IERC20[][]));
        uint256[] memory middlewareTimesIndexes = abi.decode(
            _data[2],
            (uint256[])
        );
        bool[] memory receiveAsTokens = abi.decode(_data[3], (bool[]));

        _delegationManager.completeQueuedWithdrawals(
            withdrawals,
            tokens,
            middlewareTimesIndexes,
            receiveAsTokens
        );

        // send tokens to the vault
        uint256 withdrawnAmount = _asset.balanceOf(address(this)) -
            balanceBefore;

        _asset.safeTransfer(_inceptionVault, withdrawnAmount);

        return withdrawnAmount;
    }

    function claimableAmount() public view override(IBaseAdapter, IIBaseAdapter) returns (uint256) {
        return 0;
    }

    function pendingWithdrawalAmount() public view override returns (uint256 total) {
        return 0;
    }

    function inactiveBalance() public view override returns (uint256) {
        return pendingWithdrawalAmount() + claimableAmount();
    }

    function getDeposited(
        address /*operatorAddress*/
    ) external view override returns (uint256) {
        return _strategy.userUnderlyingView(address(this));
    }

    function getTotalDeposited() external view override returns (uint256) {
        return _strategy.userUnderlyingView(address(this));
    }

    function getOperatorAddress() public view returns (address) {
        return _delegationManager.delegatedTo(address(this));
    }

    function getVersion() external pure override returns (uint256) {
        return 3;
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
}

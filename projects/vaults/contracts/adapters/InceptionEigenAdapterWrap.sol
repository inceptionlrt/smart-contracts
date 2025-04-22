// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IWStethInterface} from "../interfaces/common/IStEth.sol";
import {IEigenLayerAdapter} from "../interfaces/adapters/IEigenLayerAdapter.sol";
import {IDelegationManager} from "../interfaces/eigenlayer-vault/eigen-core/IDelegationManager.sol";
import {IStrategy} from "../interfaces/eigenlayer-vault/eigen-core/IStrategy.sol";
import {IStrategyManager} from "../interfaces/eigenlayer-vault/eigen-core/IStrategyManager.sol";
import {IRewardsCoordinator} from "../interfaces/eigenlayer-vault/eigen-core/IRewardsCoordinator.sol";

import {InceptionBaseAdapter, IBaseAdapter} from "./InceptionBaseAdapter.sol";

/**
 * @title The InceptionEigenAdapterWrap Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the EigenLayer protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract InceptionEigenAdapterWrap is InceptionBaseAdapter, IEigenLayerAdapter {
    using SafeERC20 for IERC20;

    /// @notice The strategy contract for EigenLayer
    IStrategy internal _strategy;
    /// @notice The strategy manager contract for EigenLayer
    IStrategyManager internal _strategyManager;
    /// @notice The delegation manager contract for EigenLayer
    IDelegationManager internal _delegationManager;
    /// @notice The rewards coordinator contract for EigenLayer
    IRewardsCoordinator public rewardsCoordinator;

    /**
     * @dev Constructor with initializer disabled to prevent initialization during deployment
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor() payable {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with EigenLayer and asset parameters
     * @param claimer The address authorized to claim rewards
     * @param rewardCoordinator The address of the rewards coordinator contract
     * @param delegationManager The address of the delegation manager contract
     * @param strategyManager The address of the strategy manager contract
     * @param strategy The address of the strategy contract
     * @param asset The address of the ERC20 asset token (wstETH)
     * @param trusteeManager The address of the trustee manager
     * @param inceptionVault The address of the Inception vault
     */
    function initialize(
        address claimer,
        address rewardCoordinator,
        address delegationManager,
        address strategyManager,
        address strategy,
        address asset,
        address trusteeManager,
        address inceptionVault
    ) public initializer {
        __IBaseAdapter_init(IERC20(asset), trusteeManager);

        _delegationManager = IDelegationManager(delegationManager);
        _strategyManager = IStrategyManager(strategyManager);
        _strategy = IStrategy(strategy);
        _inceptionVault = inceptionVault;
        _setRewardsCoordinator(rewardCoordinator, claimer);

        // approve spending by strategyManager
        _asset.safeApprove(strategyManager, type(uint256).max);
        IWStethInterface(address(_asset)).stETH().approve(
            strategyManager,
            type(uint256).max
        );
    }

    /**
     * @notice Delegates assets to an operator or deposits into a strategy
     * @param operator The address of the operator to delegate to (or zero for strategy deposit)
     * @param amount The amount of assets to delegate or deposit
     * @param _data Encoded data for delegation parameters
     * @return The amount of assets deposited (for strategy deposit) or 0 (for delegation)
     */
    function delegate(
        address operator,
        uint256 amount,
        bytes[] calldata _data
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        // depositIntoStrategy
        if (amount > 0 && operator == address(0)) {
            // transfer from the vault
            _asset.safeTransferFrom(msg.sender, address(this), amount);
            amount = IWStethInterface(address(_asset)).unwrap(amount);
            // deposit the asset to the appropriate strategy
            return IWStethInterface(address(_asset)).getWstETHByStETH(
                _strategy.sharesToUnderlying(
                    _strategyManager.depositIntoStrategy(
                        _strategy,
                        IWStethInterface(address(_asset)).stETH(),
                        amount
                    )
                )
            );
        }
        require(operator != address(0), NullParams());
        require(_data.length == 2, InvalidDataLength(2, _data.length));
        require(amount == 0, AmountIsNotUsed());
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

    /**
     * @notice Queues a withdrawal of shares from the strategy
     * @param shares The number of shares to withdraw
     * @param _data Additional data (must be empty)
     * @return The amount of underlying assets for the shares
     */
    function withdraw(
        address /*operator*/,
        uint256 shares,
        bytes[] calldata _data
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        require(_data.length == 0, InvalidDataLength(0, _data.length));

        uint256[] memory sharesToWithdraw = new uint256[](1);
        IStrategy[] memory strategies = new IStrategy[](1);

        strategies[0] = _strategy;
        sharesToWithdraw[0] = shares;
        address withdrawer = address(this);

        IDelegationManager.QueuedWithdrawalParams[]
            memory withdrawals = new IDelegationManager.QueuedWithdrawalParams[](
                1
            );
        withdrawals[0] = IDelegationManager.QueuedWithdrawalParams({
            strategies: strategies,
            shares: sharesToWithdraw,
            withdrawer: withdrawer
        });

        bytes32[] memory hashes = _delegationManager.queueWithdrawals(withdrawals);

        emit StartWithdrawal(
            withdrawer,
            _strategy,
            shares,
            uint32(block.number),
            _delegationManager.delegatedTo(withdrawer),
            _delegationManager.cumulativeWithdrawalsQueued(withdrawer)
        );

        emit ReturnedHashes(hashes);

        return _strategy.sharesToUnderlying(shares);
    }

    /**
     * @notice Claims a queued withdrawal and transfers assets to the vault
     * @param _data Encoded data for withdrawal parameters
     * @return The amount of assets claimed and wrapped
     */
    function claim(
        bytes[] calldata _data
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        require(_data.length == 4, InvalidDataLength(4, _data.length));
        IERC20 backedAsset = IWStethInterface(address(_asset)).stETH();
        uint256 balanceBefore = backedAsset.balanceOf(address(this));

        IDelegationManager.Withdrawal memory withdrawals = abi.decode(
            _data[0],
            (IDelegationManager.Withdrawal)
        );
        IERC20[][] memory tokens = abi.decode(_data[1], (IERC20[][]));
        if (tokens[0][0] != IWStethInterface(address(_asset)).stETH()) revert InconsistentData();
        uint256[] memory middlewareTimesIndexes = abi.decode(
            _data[2],
            (uint256[])
        );
        bool[] memory receiveAsTokens = abi.decode(_data[3], (bool[]));

        _delegationManager.completeQueuedWithdrawal(
            withdrawals,
            tokens[0],
            middlewareTimesIndexes[0],
            receiveAsTokens[0]
        );

        uint256 withdrawnAmount = backedAsset.balanceOf(address(this)) -
            balanceBefore;

        backedAsset.safeApprove(address(_asset), withdrawnAmount);
        uint256 wrapped = IWStethInterface(address(_asset)).wrap(withdrawnAmount);

        // send tokens to the vault
        _asset.safeTransfer(_inceptionVault, wrapped);

        return wrapped;
    }

    /**
     * @notice Returns the total pending withdrawal amount
     * @return total Always returns 0 (not implemented)
     */
    function pendingWithdrawalAmount()
        public
        pure
        override
        returns (uint256 total)
    {
        return 0;
    }

    /**
     * @notice Returns the total inactive balance (pending and claimable)
     * @return The total inactive balance
     */
    function inactiveBalance() public view override returns (uint256) {
        return pendingWithdrawalAmount() + claimableAmount();
    }

    /**
     * @notice Returns the total deposited assets for an operator
     * @return The total deposited assets
     */
    function getDeposited(
        address /*operatorAddress*/
    ) external view override returns (uint256) {
        return _strategy.userUnderlyingView(address(this));
    }

    /**
     * @notice Returns the total deposited shares in the strategy
     * @return The total deposited shares
     */
    function getDepositedShares() external view returns (uint256) {
        return _strategyManager.stakerStrategyShares(address(this), _strategy);
    }

    /**
     * @notice Returns the total deposited assets
     * @return The total deposited assets
     */
    function getTotalDeposited() external view override returns (uint256) {
        return _strategy.userUnderlyingView(address(this));
    }

    /**
     * @notice Returns the address of the delegated operator
     * @return The operator address
     */
    function getOperatorAddress() public view returns (address) {
        return _delegationManager.delegatedTo(address(this));
    }

    /**
     * @notice Returns the version of the adapter
     * @return The version number (3)
     */
    function getVersion() external pure override returns (uint256) {
        return 3;
    }

    /**
     * @notice Updates the rewards coordinator and claimer
     * @param newRewardsCoordinator The new rewards coordinator address
     * @param claimer The new claimer address
     */
    function setRewardsCoordinator(
        address newRewardsCoordinator,
        address claimer
    ) external onlyOwner {
        _setRewardsCoordinator(newRewardsCoordinator, claimer);
    }

    /**
     * @dev Internal function to set the rewards coordinator and claimer
     * @param newRewardsCoordinator The new rewards coordinator address
     * @param claimer The new claimer address
     */
    function _setRewardsCoordinator(
        address newRewardsCoordinator,
        address claimer
    ) internal {
        IRewardsCoordinator(newRewardsCoordinator).setClaimerFor(claimer);

        emit RewardCoordinatorChanged(
            address(rewardsCoordinator),
            newRewardsCoordinator
        );

        rewardsCoordinator = IRewardsCoordinator(newRewardsCoordinator);
    }
}

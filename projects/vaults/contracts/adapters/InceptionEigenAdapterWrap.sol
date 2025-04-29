// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IWStethInterface} from "../interfaces/common/IStEth.sol";
import {IIEigenLayerAdapter} from "../interfaces/adapters/IIEigenLayerAdapter.sol";
import {IDelegationManager} from "../interfaces/eigenlayer-vault/eigen-core/IDelegationManager.sol";
import {IStrategy} from "../interfaces/eigenlayer-vault/eigen-core/IStrategy.sol";
import {IStrategyManager} from "../interfaces/eigenlayer-vault/eigen-core/IStrategyManager.sol";
import {IRewardsCoordinator} from "../interfaces/eigenlayer-vault/eigen-core/IRewardsCoordinator.sol";

import {IBaseAdapter, IIBaseAdapter} from "./IBaseAdapter.sol";
import {IEmergencyClaimer} from "../interfaces/common/IEmergencyClaimer.sol";

/**
 * @title The InceptionEigenAdapterWrap Contract
 * @author The InceptionLRT team
 * @dev Handles delegation and withdrawal requests within the EigenLayer protocol.
 * @notice Can only be executed by InceptionVault/InceptionOperator or the owner.
 */
contract InceptionEigenAdapterWrap is IBaseAdapter, IIEigenLayerAdapter {
    using SafeERC20 for IERC20;

    IStrategy internal _strategy;
    IStrategyManager internal _strategyManager;
    IDelegationManager internal _delegationManager;
    IRewardsCoordinator public rewardsCoordinator;
    mapping(uint256 => bool) internal _emergencyQueuedWithdrawals;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    /**
     * @notice Initializes the adapter contract with required addresses and parameters
     * @param claimer Address of the contract owner
     * @param rewardCoordinator Address of the rewards coordinator contract
     * @param delegationManager Address of the delegation manager contract
     * @param strategyManager Address of the strategy manager contract
     * @param strategy Address of the strategy contract
     * @param asset Address of the underlying asset token
     * @param trusteeManager Address of the trustee manager
     * @param inceptionVault Address of the inception vault
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
        wrappedAsset().stETH().approve(strategyManager, type(uint256).max);
    }

    /**
     * @notice Delegates funds to an operator or deposits into strategy
     * @dev If operator is zero address and amount > 0, deposits into strategy
     * @param operator Address of the operator to delegate to
     * @param amount Amount of tokens to delegate/deposit
     * @param _data Additional data required for delegation [approverSalt, approverSignatureAndExpiry]
     * @return Returns 0 for delegation or deposit amount for strategy deposits
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
            amount = wrappedAsset().unwrap(amount);
            // deposit the asset to the appropriate strategy
            return wrappedAsset().getWstETHByStETH(_strategy.sharesToUnderlying(
                _strategyManager.depositIntoStrategy(
                    _strategy, wrappedAsset().stETH(), amount
                )
            ));
        }

        require(operator != address(0), NullParams());
        require(_data.length == 2, InvalidDataLength(2, _data.length));

        // prepare delegation
        bytes32 approverSalt = abi.decode(_data[0], (bytes32));
        IDelegationManager.SignatureWithExpiry
        memory approverSignatureAndExpiry = abi.decode(_data[1], (IDelegationManager.SignatureWithExpiry));

        // delegate to EL
        _delegationManager.delegateTo(
            operator,
            approverSignatureAndExpiry,
            approverSalt
        );

        return 0;
    }

    /**
     * @notice Initiates withdrawal process for funds
     * @dev Creates a queued withdrawal request in the delegation manager
     * @param amount Amount of tokens to withdraw
     * @param _data Additional data (must be empty)
     * @param emergency Flag for emergency withdrawal
     * @return Tuple of requested amount and 0
     */
    function withdraw(
        address /*operator*/,
        uint256 amount,
        bytes[] calldata _data,
        bool emergency
    ) external override onlyTrustee whenNotPaused returns (uint256, uint256) {
        require(_data.length == 0, InvalidDataLength(0, _data.length));

        uint256[] memory sharesToWithdraw = new uint256[](1);
        IStrategy[] memory strategies = new IStrategy[](1);

        strategies[0] = _strategy;
        sharesToWithdraw[0] = _strategy.underlyingToShares(
            wrappedAsset().getStETHByWstETH(amount)
        );

        address staker = address(this);
        uint256 nonce = _delegationManager.cumulativeWithdrawalsQueued(staker);
        if (emergency) _emergencyQueuedWithdrawals[nonce] = true;

        // prepare withdrawal
        IDelegationManager.QueuedWithdrawalParams[]
        memory withdrawals = new IDelegationManager.QueuedWithdrawalParams[](1);
        withdrawals[0] = IDelegationManager.QueuedWithdrawalParams({
            strategies: strategies,
            shares: sharesToWithdraw,
            withdrawer: staker
        });

        // queue withdrawal from EL
        _delegationManager.queueWithdrawals(withdrawals);

        emit StartWithdrawal(
            staker,
            _strategy,
            sharesToWithdraw[0],
            uint32(block.number),
            _delegationManager.delegatedTo(staker),
            nonce
        );

        return (wrappedAsset().getWstETHByStETH(
            _strategy.sharesToUnderlyingView(sharesToWithdraw[0])
        ), 0);
    }

    /**
     * @notice Completes the withdrawal process and claims tokens
     * @dev Processes the queued withdrawal and transfers tokens to inception vault
     * @param _data Array containing withdrawal data [withdrawal, tokens, receiveAsTokens]
     * @param emergency Flag for emergency withdrawal
     * @return Amount of tokens withdrawn
     */
    function claim(
        bytes[] calldata _data, bool emergency
    ) external override onlyTrustee whenNotPaused returns (uint256) {
        require(_data.length == 3, InvalidDataLength(3, _data.length));

        IERC20 backedAsset = wrappedAsset().stETH();
        uint256 balanceBefore = backedAsset.balanceOf(address(this));

        // prepare withdrawal
        IDelegationManager.Withdrawal memory withdrawal = abi.decode(_data[0], (IDelegationManager.Withdrawal));
        IERC20[][] memory tokens = abi.decode(_data[1], (IERC20[][]));
        bool[] memory receiveAsTokens = abi.decode(_data[2], (bool[]));

        // emergency claim available only for emergency queued withdrawals
        if (emergency) {
            require(_emergencyQueuedWithdrawals[withdrawal.nonce] == true, OnlyEmergency());
        }

        // claim from EL
        _delegationManager.completeQueuedWithdrawal(withdrawal, tokens[0], receiveAsTokens[0]);

        // send tokens to the vault
        uint256 withdrawnAmount = backedAsset.balanceOf(address(this)) - balanceBefore;
        backedAsset.safeApprove(address(_asset), withdrawnAmount);
        uint256 wrapped = wrappedAsset().wrap(withdrawnAmount);
        _asset.safeTransfer(_inceptionVault, wrapped);

        // update emergency withdrawal state
        _emergencyQueuedWithdrawals[withdrawal.nonce] = false;

        return wrappedAsset().getWstETHByStETH(withdrawnAmount);
    }

    /**
     * @notice Returns the total amount pending withdrawal
     * @return total Total amount of non-emergency pending withdrawals
     */
    function pendingWithdrawalAmount() public view override returns (uint256 total)
    {
        return _pendingWithdrawalAmount(false);
    }

    /**
     * @notice Internal function to calculate pending withdrawal amount
     * @dev Filters withdrawals based on emergency status
     * @param emergency Flag to filter emergency withdrawals
     * @return total Total amount of pending withdrawals matching emergency status
     */
    function _pendingWithdrawalAmount(bool emergency) internal view returns (uint256 total) {
        (IDelegationManager.Withdrawal[] memory withdrawals,
            uint256[][] memory shares) = _delegationManager.getQueuedWithdrawals(address(this));

        for (uint256 i = 0; i < withdrawals.length; i++) {
            if (emergency != _emergencyQueuedWithdrawals[withdrawals[i].nonce]) {
                continue;
            }

            total += shares[i][0];
        }

        return wrappedAsset().getWstETHByStETH(
            _strategy.sharesToUnderlyingView(total)
        );
    }

    /**
     * @notice Returns the total inactive balance
     * @return Sum of pending withdrawals and claimable amounts
     */
    function inactiveBalance() public view override returns (uint256) {
        return pendingWithdrawalAmount() + claimableAmount();
    }

    /**
     * @notice Returns the total inactive balance for emergency withdrawals
     * @return Sum of emergency pending withdrawals and claimable amounts
     */
    function inactiveBalanceEmergency() public view override returns (uint256) {
        return _pendingWithdrawalAmount(true) + claimableAmount();
    }

    /**
     * @notice Returns the current operator address for this adapter
     * @return Address of the operator this adapter is delegated to
     */
    function getOperatorAddress() public view returns (address) {
        return _delegationManager.delegatedTo(address(this));
    }

    /**
     * @notice Returns the amount deposited for a specific operator
     * @return Amount of underlying tokens deposited
     */
    function getDeposited(
        address /*operatorAddress*/
    ) external view override returns (uint256) {
        return wrappedAsset().getWstETHByStETH(
            _strategy.userUnderlyingView(address(this))
        );
    }

    /**
     * @notice Returns the total amount deposited in the strategy
     * @return Total amount of underlying tokens deposited
     */
    function getTotalDeposited() external view override returns (uint256) {
        IStrategy[] memory strategies = new IStrategy[](1);
        strategies[0] = _strategy;

        (uint256[] memory withdrawableShares,) = _delegationManager.getWithdrawableShares(
            address(this), strategies
        );

        return wrappedAsset().getWstETHByStETH(
            _strategy.sharesToUnderlyingView(withdrawableShares[0])
        );
    }

    /**
     * @notice Returns the amount of strategy shares held
     * @return Amount of strategy shares
     */
    function getDepositedShares() external view returns (uint256) {
        return _strategy.underlyingToSharesView(_strategy.userUnderlyingView(address(this)));
    }

    /**
     * @notice Returns the wrapped asset
     * @return Wrapped asset
     */
    function wrappedAsset() internal view returns (IWStethInterface) {
        return IWStethInterface(address(_asset));
    }

    /**
     * @notice Returns the contract version
     * @return Current version number (3)
     */
    function getVersion() external pure override returns (uint256) {
        return 3;
    }

    /**
     * @notice Updates the rewards coordinator address
     * @dev Can only be called by the owner
     * @param newRewardsCoordinator Address of the new rewards coordinator
     * @param claimer Address of the owner to set as claimer
     */
    function setRewardsCoordinator(
        address newRewardsCoordinator,
        address claimer
    ) external onlyOwner {
        _setRewardsCoordinator(newRewardsCoordinator, claimer);
    }

    /**
     * @notice Internal function to set the rewards coordinator
     * @dev Updates the rewards coordinator and sets the claimer
     * @param newRewardsCoordinator Address of the new rewards coordinator
     * @param claimer Address of the owner to set as claimer
     */
    function _setRewardsCoordinator(address newRewardsCoordinator, address claimer) internal {
        IRewardsCoordinator(newRewardsCoordinator).setClaimerFor(claimer);

        emit RewardCoordinatorChanged(
            address(rewardsCoordinator),
            newRewardsCoordinator
        );

        rewardsCoordinator = IRewardsCoordinator(newRewardsCoordinator);
    }
}

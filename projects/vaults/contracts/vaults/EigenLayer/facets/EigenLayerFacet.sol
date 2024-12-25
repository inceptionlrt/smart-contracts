// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BeaconProxy} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "../InceptionVaultStorage_EL.sol";

/**
 * @title The EigenLayerFacet contract
 * @author The InceptionLRT team
 */
contract EigenLayerFacet is InceptionVaultStorage_EL {
    constructor() payable {}

    /**
     * @dev checks whether it's still possible to deposit into the strategy
     */
    function _beforeDepositAssetIntoStrategy(uint256 amount) internal view {
        if (amount > getFreeBalance())
            revert InsufficientCapacity(totalAssets());

        (uint256 maxPerDeposit, uint256 maxTotalDeposits) = strategy
            .getTVLLimits();

        if (amount > maxPerDeposit)
            revert ExceedsMaxPerDeposit(maxPerDeposit, amount);

        uint256 currentBalance = _asset.balanceOf(address(strategy));
        if (currentBalance + amount > maxTotalDeposits)
            revert ExceedsMaxTotalDeposited(maxTotalDeposits, currentBalance);
    }

    function redelegateToOperator(
        address elOperator,
        address newOperator,
        IDelegationManager.SignatureWithExpiry memory newOperatorApproverSig,
        bytes32 approverSalt
    ) external {
        if (elOperator == address(0) || newOperator == address(0)) revert NullParams();

        // try to find a restaker for the specific EL operator
        address restaker = _operatorRestakers[elOperator];
        if (restaker == address(0)) revert OperatorNotRegistered();

        _redelegateToOperator(
            restaker,
            newOperator,
            newOperatorApproverSig,
            approverSalt
        );

        emit RedelegatedTo(restaker, elOperator, newOperator);
    }

    /**
     * @dev redelegates assets held in the strategy to the new operator.
     */
    function _redelegateToOperator(
        address restaker,
        address newOperator,
        IDelegationManager.SignatureWithExpiry memory newOperatorApproverSig,
        bytes32 approverSalt
    ) internal {
        IInceptionEigenRestaker(restaker).redelegateToOperator(
            newOperator,
            newOperatorApproverSig,
            approverSalt
        );
    }

    function delegateToOperator(
        uint256 amount,
        address elOperator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) external {
        if (elOperator == address(0)) revert NullParams();

        _beforeDepositAssetIntoStrategy(amount);

        // try to find a restaker for the specific EL operator
        address restaker = _operatorRestakers[elOperator];
        if (restaker == address(0)) revert OperatorNotRegistered();

        bool delegate = false;
        if (restaker == _MOCK_ADDRESS) {
            delegate = true;
            // deploy a new restaker
            restaker = _deployNewStub();
            _operatorRestakers[elOperator] = restaker;
            restakers.push(restaker);
        }

        _depositAssetIntoStrategy(restaker, amount);

        if (delegate)
            _delegateToOperator(
                restaker,
                elOperator,
                approverSalt,
                approverSignatureAndExpiry
            );

        emit DelegatedTo(restaker, elOperator, amount);
    }

    /**
     * @dev delegates assets held in the strategy to the EL operator.
     */
    function _delegateToOperator(
        address restaker,
        address elOperator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) internal {
        IInceptionEigenRestaker(restaker).delegateToOperator(
            elOperator,
            approverSalt,
            approverSignatureAndExpiry
        );
    }

    /// @dev deposits asset to the corresponding strategy
    function _depositAssetIntoStrategy(address restaker, uint256 amount)
    internal
    {
        _asset.approve(restaker, amount);
        IInceptionEigenRestaker(restaker).depositAssetIntoStrategy(amount);

        emit DepositedToEL(restaker, amount);
    }

    /**
     * @dev performs creating a withdrawal request from EigenLayer
     * @dev requires a specific amount to withdraw
     */
    function undelegateVault(uint256 amount) external nonReentrant {
        address staker = address(this);

        uint256[] memory sharesToWithdraw = new uint256[](1);
        IStrategy[] memory strategies = new IStrategy[](1);

        sharesToWithdraw[0] = _undelegate(amount, staker);
        strategies[0] = strategy;
        IDelegationManager.QueuedWithdrawalParams[]
        memory withdrawals = new IDelegationManager.QueuedWithdrawalParams[](
            1
        );

        /// @notice from Vault
        withdrawals[0] = IDelegationManager.QueuedWithdrawalParams({
            strategies: strategies,
            shares: sharesToWithdraw,
            withdrawer: address(this)
        });
        delegationManager.queueWithdrawals(withdrawals);
    }

    /**
     * @dev performs creating a withdrawal request from EigenLayer
     * @dev requires a specific amount to withdraw
     */
    function undelegateFrom(address elOperatorAddress, uint256 amount)
    external
    nonReentrant
    {
        address staker = _operatorRestakers[elOperatorAddress];
        if (staker == address(0)) revert OperatorNotRegistered();
        if (staker == _MOCK_ADDRESS) revert NullParams();

        IInceptionEigenRestaker(staker).withdrawFromEL(
            _undelegate(amount, staker)
        );
    }

    function _undelegate(uint256 amount, address staker)
    internal
    returns (uint256)
    {
        uint256 nonce = delegationManager.cumulativeWithdrawalsQueued(staker);
        uint256 totalAssetSharesInEL = strategyManager.stakerDepositShares(
            staker,
            strategy
        );
        uint256 shares = strategy.underlyingToSharesView(amount);
        amount = strategy.sharesToUnderlyingView(shares);

        // we need to withdraw the remaining dust from EigenLayer
        if (totalAssetSharesInEL < shares + 5) shares = totalAssetSharesInEL;

        IStrategy[] memory strategies = new IStrategy[](1);
        strategies[0] = strategy;
        (uint256[] memory withdrawableShares,) = delegationManager.getWithdrawableShares(staker, strategies);
        if (shares > withdrawableShares[0]) revert WithdrawableSharesExceeded();

        _pendingWithdrawalAmount += amount;
        emit StartWithdrawal(
            staker,
            strategy,
            shares,
            uint32(block.number),
            delegationManager.delegatedTo(staker),
            nonce
        );
        return shares;
    }

    /**
     * @dev claims completed withdrawals from EigenLayer, if they exist
     */
    function claimCompletedWithdrawals(
        address restaker,
        IDelegationManagerTypes.Withdrawal[] calldata withdrawals
    ) public nonReentrant {
        uint256 withdrawalsNum = withdrawals.length;
        IERC20[][] memory tokens = new IERC20[][](withdrawalsNum);
        bool[] memory receiveAsTokens = new bool[](withdrawalsNum);

        for (uint256 i = 0; i < withdrawalsNum; ++i) {
            tokens[i] = new IERC20[](1);
            tokens[i][0] = _asset;
            receiveAsTokens[i] = true;
        }

        uint256 availableBalance = getFreeBalance();

        uint256 withdrawnAmount;
        if (restaker == address(this)) {
            withdrawnAmount = _claimCompletedWithdrawalsForVault(
                withdrawals,
                tokens,
                receiveAsTokens
            );
        } else {
            if (!_restakerExists(restaker)) revert RestakerNotRegistered();
            withdrawnAmount = IInceptionEigenRestaker(restaker)
                .claimWithdrawals(withdrawals, tokens, receiveAsTokens);
        }

        emit WithdrawalClaimed(withdrawnAmount);

        _pendingWithdrawalAmount = _pendingWithdrawalAmount < withdrawnAmount
            ? 0
            : _pendingWithdrawalAmount - withdrawnAmount;

        if (_pendingWithdrawalAmount < 7) {
            _pendingWithdrawalAmount = 0;
        }

        _updateEpoch(availableBalance + withdrawnAmount);
    }

    function _claimCompletedWithdrawalsForVault(
        IDelegationManagerTypes.Withdrawal[] memory withdrawals,
        IERC20[][] memory tokens,
        bool[] memory receiveAsTokens
    ) internal returns (uint256) {
        uint256 balanceBefore = _asset.balanceOf(address(this));

        delegationManager.completeQueuedWithdrawals(
            withdrawals,
            tokens,
            receiveAsTokens
        );

        // send tokens to the vault
        uint256 withdrawnAmount = _asset.balanceOf(address(this)) -
                    balanceBefore;

        return withdrawnAmount;
    }

    function updateEpoch() external nonReentrant {
        _updateEpoch(getFreeBalance());
    }

    function _restakerExists(address restakerAddress)
    internal
    view
    returns (bool)
    {
        uint256 numOfRestakers = restakers.length;
        for (uint256 i = 0; i < numOfRestakers; ++i) {
            if (restakerAddress == restakers[i]) return true;
        }
        return false;
    }

    function _updateEpoch(uint256 availableBalance) internal {
        uint256 withdrawalsNum = claimerWithdrawalsQueue.length;
        for (uint256 i = epoch; i < withdrawalsNum;) {
            uint256 amount = claimerWithdrawalsQueue[i].amount;
            unchecked {
                if (amount > availableBalance) {
                    break;
                }
                redeemReservedAmount += amount;
                availableBalance -= amount;
                ++epoch;
                ++i;
            }
        }
    }

    function forceUndelegateRecovery(uint256 amount, address restaker)
    external
    {
        if (restaker == address(0)) revert NullParams();
        for (uint256 i = 0; i < restakers.length; ++i) {
            if (
                restakers[i] == restaker &&
                !delegationManager.isDelegated(restakers[i])
            ) {
                restakers[i] == _MOCK_ADDRESS;
                break;
            }
        }
        _pendingWithdrawalAmount += amount;
    }

    function _deployNewStub() internal returns (address) {
        if (stakerImplementation == address(0)) revert ImplementationNotSet();
        // deploy new beacon proxy and do init call
        bytes memory data = abi.encodeWithSignature(
            "initialize(address,address,address,address,address,address,address)",
            owner(),
            rewardsCoordinator,
            delegationManager,
            strategyManager,
            strategy,
            _asset,
            _operator
        );
        address deployedAddress = address(new BeaconProxy(address(this), data));

        IOwnable asOwnable = IOwnable(deployedAddress);
        asOwnable.transferOwnership(owner());

        emit RestakerDeployed(deployedAddress);
        return deployedAddress;
    }

    /**
     * @notice Adds new rewards to the contract, starting a new rewards timeline.
     * @dev The function allows the operator to deposit Ether as rewards.
     * It verifies that the previous rewards timeline is over before accepting new rewards.
     */
    function addRewards(uint256 amount) external nonReentrant {
        /// @dev verify whether the prev timeline is over
        if (currentRewards > 0) {
            uint256 totalDays = rewardsTimeline / 1 days;
            uint256 dayNum = (block.timestamp - startTimeline) / 1 days;
            if (dayNum < totalDays) revert TimelineNotOver();
        }
        currentRewards = _transferAssetFrom(_operator, amount);
        startTimeline = block.timestamp;

        emit RewardsAdded(amount, startTimeline);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../assets-handler/InceptionAssetsHandler.sol";
import "../../interfaces/IStrategyManager.sol";
import "../../interfaces/IEigenLayerHandler.sol";
import "../../interfaces/IDepositManager.sol";

/// @author The InceptionLRT team
/// @title The EigenLayerHandler contract
/// @dev Serves communication with external EigenLayer protocol
/// @dev Specifically, this includes depositing, and handling withdrawal requests
contract EigenLayerHandler is InceptionAssetsHandler, IEigenLayerHandler {
    IStrategyManager public strategyManager;
    IStrategy public strategy;

    uint256 public epoch;

    address internal _operator;

    /// @dev totalEthToWithdraw is a total pending amount for withdrawal
    uint256 public totalAmountToWithdraw;

    /// @dev Pending withdrawal amount in EigenLayer which
    /// was withdrawn but no claimed from EigenLayer
    uint256 internal _pendingWithdrawalAmount;

    uint256[44] private __reserver;

    modifier onlyOperator() {
        require(
            msg.sender == _operator,
            "EigenLayerHandler: only operator allowed"
        );
        _;
    }

    function __EigenLayerHandler_init(
        IStrategyManager _strategyManager,
        IStrategy _assetStrategy
    ) internal onlyInitializing {
        strategyManager = _strategyManager;
        strategy = _assetStrategy;

        __InceptionAssetsHandler_init(_assetStrategy.underlyingToken());
        // approve spending by strategyManager
        require(
            _asset.approve(address(strategyManager), type(uint256).max),
            "EigenLayerHandler: approve failed"
        );
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    /// @dev Deposits the asset to the corresponding strategy
    function _depositAssetToEL(uint256 amount) internal {
        // deposit the asset to the appropriate strategy
        strategyManager.depositIntoStrategy(strategy, _asset, amount);

        emit DepositedToEL(amount);
    }

    /// @dev Deposits extra assets into strategy
    function depositExtra() external whenNotPaused nonReentrant onlyOperator {
        uint256 vaultBalance = totalAssets();
        uint256 toWithdrawAmount = totalAmountToWithdraw;
        if (vaultBalance <= toWithdrawAmount) {
            return;
        }

        uint256 shares = strategyManager.depositIntoStrategy(
            strategy,
            _asset,
            vaultBalance - toWithdrawAmount
        );

        emit DepositedToEL(strategy.sharesToUnderlyingView(shares));
    }

    /*/////////////////////////////////
    ////// Withdrawal functions //////
    ///////////////////////////////*/

    /// @dev Performs the creation of a withdrawal request from EigenLayer
    /// @dev Automatically generates a withdrawal amount based on the pending state
    /// @notice Updates _pendingWithdrawalAmount
    /// @notice Can be executed only by the operator and within the rebalance period,
    /// when the epoch is odd
    function withdrawFromEL() external whenNotPaused nonReentrant onlyOperator {
        if (epoch % 2 != 0) {
            revert RebalanceNotInProgress();
        }
        epoch++;
        (
            uint256[] memory strategyIndexes,
            uint256[] memory sharesToWithdraw,
            IStrategy[] memory elStrategies,
            uint256 amount
        ) = _generateELWithdrawal();
        // make withdrawal from EigenLayer
        _pendingWithdrawalAmount += amount;
        _withdrawFromEL(strategyIndexes, sharesToWithdraw, elStrategies);
    }

    /// @dev Generates a withdrawal request for strategyManager
    /// @dev Emits an event with the necessary data for further claiming of this request
    function _withdrawFromEL(
        uint256[] memory strategyIndexes,
        uint256[] memory sharesToWithdraw,
        IStrategy[] memory strategies
    ) internal {
        uint96 nonce = uint96(
            strategyManager.numWithdrawalsQueued(address(this))
        );
        address delegatedAddress = IDepositManager(strategyManager.delegation())
            .delegatedTo(address(this));

        bytes32 rootHash = strategyManager.queueWithdrawal(
            strategyIndexes,
            strategies,
            sharesToWithdraw,
            address(this),
            false
        );

        emit StartWithdrawal(
            rootHash,
            strategies,
            sharesToWithdraw,
            uint32(block.number),
            delegatedAddress,
            nonce
        );
    }

    /// @dev Withdraws a completed withdrawal from EigenLayer if it exists
    function claimCompletedWithdrawals(
        IStrategyManager.QueuedWithdrawal calldata withdrawal,
        IERC20[] calldata assetsToClaim
    ) public whenNotPaused nonReentrant {
        require(
            strategyManager.withdrawalRootPending(
                strategyManager.calculateWithdrawalRoot(withdrawal)
            ),
            "InceptionVault: there is no withdrawal"
        );
        uint256 depositedBefore = totalAssets();
        strategyManager.completeQueuedWithdrawal(
            withdrawal,
            assetsToClaim,
            0,
            true
        );

        uint256 withdrawalAmount = _getAssetRedeemAmount(
            totalAssets() - depositedBefore
        );

        _pendingWithdrawalAmount = _pendingWithdrawalAmount < withdrawalAmount
            ? 0
            : _pendingWithdrawalAmount - withdrawalAmount;

        epoch++;

        emit WithdrawalClaimed();
    }

    /// @dev Withdraws assets from EigenLayer
    /// @dev It's used in withdrawFromELEth()
    function _generateELWithdrawal()
        internal
        view
        returns (
            uint256[] memory,
            uint256[] memory,
            IStrategy[] memory,
            uint256
        )
    {
        uint256[] memory strategyIndexes = new uint256[](1);
        uint256[] memory sharesToWithdraw = new uint256[](1);
        IStrategy[] memory strategies = new IStrategy[](1);
        strategies[0] = strategy;

        if (totalAmountToWithdraw <= totalAssets()) {
            revert WithdrawFutile();
        }
        if (totalAmountToWithdraw - totalAssets() <= _pendingWithdrawalAmount) {
            revert WithdrawFutile();
        }
        uint256 amount = totalAmountToWithdraw -
            totalAssets() -
            _pendingWithdrawalAmount;

        sharesToWithdraw[0] = strategy.underlyingToSharesView(amount);

        uint256 totalAssetSharesInEL = strategyManager.stakerStrategyShares(
            address(this),
            strategy
        );
        // we need to withdraw the remaining dust from EigenLayer
        if (
            totalAssetSharesInEL < sharesToWithdraw[0] + 5 ||
            sharesToWithdraw[0] > totalAssetSharesInEL
        ) {
            sharesToWithdraw[0] = totalAssetSharesInEL;
        }

        return (strategyIndexes, sharesToWithdraw, strategies, amount);
    }

    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    /// @dev Returns the total deposited assets
    /// @dev Total EL deposited amount +
    /// totalAssets(vault balance) +
    /// unclaimed pending withdrawal from EigenLayer
    function getTotalDeposited() public view returns (uint256) {
        return
            strategy.userUnderlyingView(address(this)) +
            totalAssets() +
            _pendingWithdrawalAmount;
    }

    function getPendingWithdrawalAmountFromEL()
        public
        view
        returns (uint256 total)
    {
        return _pendingWithdrawalAmount;
    }

    /// @dev Serves to unblock pending withdrawals for claiming them
    function updateEpoch(uint256 newEpoch) external onlyOperator {
        if (newEpoch <= epoch) {
            revert WrongEpoch();
        }
        epoch = newEpoch;
    }
}

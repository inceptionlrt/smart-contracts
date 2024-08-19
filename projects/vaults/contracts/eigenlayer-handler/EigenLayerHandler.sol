// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {InceptionAssetsHandler, IERC20, InceptionLibrary, Convert} from "../assets-handler/InceptionAssetsHandler.sol";

import {IStrategyManager, IStrategy} from "../interfaces/IStrategyManager.sol";
import {IDelegationManager} from "../interfaces/IDelegationManager.sol";
import {IEigenLayerHandler} from "../interfaces/IEigenLayerHandler.sol";
import {IInceptionRestaker} from "../interfaces/IInceptionRestaker.sol";
import {IMellowRestaker} from "../interfaces/IMellowRestaker.sol";
import {ISymbioticRestaker} from "../interfaces/ISymbioticRestaker.sol";

import "hardhat/console.sol";

/// @author The InceptionLRT team
/// @title The EigenLayerHandler contract
/// @dev Serves communication with external EigenLayer protocol
/// @dev Specifically, this includes depositing, and handling withdrawal requests
contract EigenLayerHandler is InceptionAssetsHandler, IEigenLayerHandler {
    IStrategyManager public strategyManager;
    IStrategy public strategy;

    uint256 public epoch;

    /// @dev inception operator
    address internal _operator;

    /// @dev represents the pending amount to be redeemed by claimers,
    /// @notice + amount to undelegate from EigenLayer
    uint256 public totalAmountToWithdraw;

    /// @dev represents the amount pending processing until it is claimed
    /// @dev amount measured in asset
    uint256 internal _pendingWithdrawalAmount;

    IDelegationManager public delegationManager;

    Withdrawal[] public claimerWithdrawalsQueue;

    address internal constant _MOCK_ADDRESS =
        0x0000000000000000000000000012345000000000;

    /// @dev heap reserved for the claimers
    uint256 public redeemReservedAmount;

    /// @dev EigenLayer operator -> inception staker
    mapping(address => address) internal _operatorRestakers;
    address[] public restakers;

    uint256 public depositBonusAmount;

    /// @dev measured in percentage, MAX_TARGET_PERCENT - 100%
    uint256 public targetCapacity;

    uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;

    IMellowRestaker public mellowRestaker;
    ISymbioticRestaker public symbioticRestaker;

    /// @dev constants are not stored in the storage
    uint256[50 - 15] private __reserver;

    modifier onlyOperator() {
        if (msg.sender != _operator) revert OnlyOperatorAllowed();
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
        if (!_asset.approve(address(strategyManager), type(uint256).max))
            revert ApproveError();
    }

    /*/////////////////////////////////
    ////// Withdrawal functions //////
    ///////////////////////////////*/

    /// @dev performs creating a withdrawal request from EigenLayer
    /// @dev requires a specific amount to withdraw
    function undelegateFrom(
        address elOperatorAddress,
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        _fallback(eigenLayerFacet);
    }

    /// @dev performs creating a withdrawal request from EigenLayer
    /// @dev requires a specific amount to withdraw
    function undelegateMellow(
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        _fallback(mellowFacet);
    }

    /// @dev performs creating a withdrawal request from EigenLayer
    /// @dev requires a specific amount to withdraw
    function undelegateSymbiotic(
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        _fallback(symbioticFacet);
    }

    /// @dev performs creating a withdrawal request from EigenLayer
    /// @dev requires a specific amount to withdraw
    function undelegateVault(
        uint256 amount
    ) external whenNotPaused nonReentrant onlyOperator {
        _fallback(eigenLayerFacet);
    }

    /// @dev claims completed withdrawals from EigenLayer, if they exist
    function claimCompletedWithdrawals(
        address restaker,
        IDelegationManager.Withdrawal[] calldata withdrawals
    ) public whenNotPaused nonReentrant {
        _fallback(eigenLayerFacet);
    }

    /// @dev TODO
    function claimMellowWithdrawals() public whenNotPaused nonReentrant {
        _fallback(mellowFacet);
    }

    /// @dev TODO
    function claimSymbiotic() external whenNotPaused nonReentrant onlyOperator {
        _fallback(symbioticFacet);
    }

    function updateEpoch() external whenNotPaused {
        _updateEpoch(getFreeBalance());
    }

    /**
     * @dev let's calculate how many withdrawals we can cover with the withdrawnAmount
     * @dev #init state:
     * - balance of the vault: X
     * - epoch: means that the vault can handle the withdrawal queue up to the epoch index
     * withdrawalQueue[... : epoch];
     *
     * @dev #new state:
     * - balance of the vault: X + withdrawnAmount
     * - we need to recalculate a new value for epoch, new_epoch, to cover withdrawals:
     * withdrawalQueue[epoch : new_epoch];
     */
    function _updateEpoch(uint256 availableBalance) internal {
        uint256 withdrawalsNum = claimerWithdrawalsQueue.length;
        for (uint256 i = epoch; i < withdrawalsNum; ) {
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

    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    /// @dev returns the total deposited into asset strategy
    function getTotalDeposited() public view returns (uint256) {
        return
            getTotalDelegated() +
            totalAssets() +
            _pendingWithdrawalAmount -
            depositBonusAmount;
    }

    function getPendingWithdrawalAmountFromMellow()
        public
        view
        returns (uint256)
    {
        uint256 pendingWithdrawal = mellowRestaker.pendingWithdrawalAmount();
        uint256 claimableAmount = mellowRestaker.claimableAmount();
        return pendingWithdrawal + claimableAmount;
    }

    function getTotalDelegated() public view returns (uint256 total) {
        uint256 stakersNum = restakers.length;
        for (uint256 i = 0; i < stakersNum; ++i) {
            if (restakers[i] == address(0)) continue;
            total += strategy.userUnderlyingView(restakers[i]);
        }
        // console.log(
        //     "===================================  mellowRestaker.getDeposited(): ",
        //     mellowRestaker.getDeposited()
        // );
        return total + strategy.userUnderlyingView(address(this));
        // mellowRestaker.getDeposited();
    }

    function getFreeBalance() public view returns (uint256 total) {
        return
            getFlashCapacity() < _getTargetCapacity()
                ? 0
                : getFlashCapacity() - _getTargetCapacity();
    }

    function getPendingWithdrawalAmountFromEL()
        public
        view
        returns (uint256 total)
    {
        return _pendingWithdrawalAmount;
    }

    function getFlashCapacity() public view returns (uint256 total) {
        return totalAssets() - redeemReservedAmount - depositBonusAmount;
    }

    function _getTargetCapacity() internal view returns (uint256) {
        return (targetCapacity * getTotalDeposited()) / MAX_TARGET_PERCENT;
    }

    /*//////////////////////////
    ////// SET functions //////
    ////////////////////////*/

    function setDelegationManager(
        IDelegationManager newDelegationManager
    ) external onlyOwner {
        _fallback(setterFacet);
    }

    function setTargetFlashCapacity(
        uint256 newTargetCapacity
    ) external onlyOwner {
        _fallback(setterFacet);
    }

    function forceUndelegateRecovery(
        uint256 amount,
        address restaker
    ) external onlyOperator {
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
}

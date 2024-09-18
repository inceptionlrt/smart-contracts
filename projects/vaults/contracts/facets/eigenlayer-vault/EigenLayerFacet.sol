// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import {BeaconProxy, Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import {EigenVaultStorageFacet} from "./EigenVaultStorageFacet.sol";

import {IEigenLayerHandler} from "../../interfaces/eigenlayer-vault/IEigenLayerHandler.sol";
import {IOwnable} from "../../interfaces/common/IOwnable.sol";
import {IInceptionVault_EL} from "../../interfaces/eigenlayer-vault/IInceptionVault_EL.sol";
import {IInceptionToken} from "../../interfaces/common/IInceptionToken.sol";
import {IDelegationManager} from "../../interfaces/eigenlayer-vault/eigen-core/IDelegationManager.sol";
import {IInceptionRatioFeed} from "../../interfaces/common/IInceptionRatioFeed.sol";

import {IIEigenRestaker, IIEigenRestakerErrors} from "../../interfaces/eigenlayer-vault/IIEigenRestaker.sol";

import "../../handlers/eigenlayer-handler/EigenLayerHandler.sol";

import {IInceptionVaultErrors} from "../../interfaces/common/IInceptionVaultErrors.sol";

import "hardhat/console.sol";

contract EigenLayerFacet is
    EigenVaultStorageFacet,
    IEigenLayerHandler,
    IInceptionVaultErrors
{
    /// @dev checks whether it's still possible to deposit into the strategy
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

    function delegateToOperator(
        uint256 amount,
        address elOperator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) external nonReentrant {
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

        emit IEigenLayerHandler.DelegatedTo(restaker, elOperator, amount);
    }

    /// @dev delegates assets held in the strategy to the EL operator.
    function _delegateToOperator(
        address restaker,
        address elOperator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) internal {
        IIEigenRestaker(restaker).delegateToOperator(
            elOperator,
            approverSalt,
            approverSignatureAndExpiry
        );
    }

    /// @dev deposits asset to the corresponding strategy
    function _depositAssetIntoStrategy(
        address restaker,
        uint256 amount
    ) internal {
        _asset.approve(restaker, amount);
        IIEigenRestaker(restaker).depositAssetIntoStrategy(amount);

        emit IEigenLayerHandler.DepositedToEL(restaker, amount);
    }

    /// @dev performs creating a withdrawal request from EigenLayer
    /// @dev requires a specific amount to withdraw
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

    /// @dev performs creating a withdrawal request from EigenLayer
    /// @dev requires a specific amount to withdraw
    function undelegateFrom(
        address elOperatorAddress,
        uint256 amount
    ) external nonReentrant {
        address staker = _operatorRestakers[elOperatorAddress];
        if (staker == address(0)) revert OperatorNotRegistered();
        if (staker == _MOCK_ADDRESS) revert NullParams();

        IIEigenRestaker(staker).withdrawFromEL(_undelegate(amount, staker));
    }

    function _undelegate(
        uint256 amount,
        address staker
    ) internal returns (uint256) {
        uint256 nonce = delegationManager.cumulativeWithdrawalsQueued(staker);
        uint256 totalAssetSharesInEL = strategyManager.stakerStrategyShares(
            staker,
            strategy
        );
        uint256 shares = strategy.underlyingToSharesView(amount);
        amount = strategy.sharesToUnderlyingView(shares);

        // we need to withdraw the remaining dust from EigenLayer
        if (totalAssetSharesInEL < shares + 5) shares = totalAssetSharesInEL;

        _pendingWithdrawalAmount += amount;
        emit IEigenLayerHandler.StartWithdrawal(
            staker,
            strategy,
            shares,
            uint32(block.number),
            delegationManager.delegatedTo(staker),
            nonce
        );
        return shares;
    }

    /// @dev claims completed withdrawals from EigenLayer, if they exist
    function claimCompletedWithdrawals(
        address restaker,
        IDelegationManager.Withdrawal[] calldata withdrawals
    ) public nonReentrant {
        uint256 withdrawalsNum = withdrawals.length;
        IERC20[][] memory tokens = new IERC20[][](withdrawalsNum);
        uint256[] memory middlewareTimesIndexes = new uint256[](withdrawalsNum);
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
                middlewareTimesIndexes,
                receiveAsTokens
            );
        } else {
            if (!_restakerExists(restaker)) revert RestakerNotRegistered();
            withdrawnAmount = IIEigenRestaker(restaker).claimWithdrawals(
                withdrawals,
                tokens,
                middlewareTimesIndexes,
                receiveAsTokens
            );
        }

        emit IEigenLayerHandler.WithdrawalClaimed(withdrawnAmount);

        _pendingWithdrawalAmount = _pendingWithdrawalAmount < withdrawnAmount
            ? 0
            : _pendingWithdrawalAmount - withdrawnAmount;

        if (_pendingWithdrawalAmount < 7) {
            _pendingWithdrawalAmount = 0;
        }

        _updateEpoch(availableBalance + withdrawnAmount);
    }

    function _claimCompletedWithdrawalsForVault(
        IDelegationManager.Withdrawal[] memory withdrawals,
        IERC20[][] memory tokens,
        uint256[] memory middlewareTimesIndexes,
        bool[] memory receiveAsTokens
    ) internal returns (uint256) {
        uint256 balanceBefore = _asset.balanceOf(address(this));

        delegationManager.completeQueuedWithdrawals(
            withdrawals,
            tokens,
            middlewareTimesIndexes,
            receiveAsTokens
        );

        // send tokens to the vault
        uint256 withdrawnAmount = _asset.balanceOf(address(this)) -
            balanceBefore;

        return withdrawnAmount;
    }

    function updateEpoch() external {
        _updateEpoch(getFreeBalance());
    }

    function _restakerExists(
        address restakerAddress
    ) internal view returns (bool) {
        uint256 numOfRestakers = restakers.length;
        for (uint256 i = 0; i < numOfRestakers; ++i) {
            if (restakerAddress == restakers[i]) return true;
        }
        return false;
    }

    function _updateEpoch(uint256 availableBalance) internal {
        uint256 withdrawalsNum = claimerWithdrawalsQueue.length;
        console.log("++++++++++++++ withdrawalsNum: ", withdrawalsNum);
        for (uint256 i = epoch; i < withdrawalsNum; ) {
            uint256 amount = claimerWithdrawalsQueue[i].amount;
            console.log(amount, availableBalance);
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

    function getFreeBalance() public view returns (uint256 total) {
        return
            getFlashCapacity() < _getTargetCapacity()
                ? 0
                : getFlashCapacity() - _getTargetCapacity();
    }

    function getFlashCapacity() public view returns (uint256 total) {
        return totalAssets() - redeemReservedAmount - depositBonusAmount;
    }

    function _getTargetCapacity() internal view returns (uint256) {
        return (targetCapacity * getTotalDeposited()) / MAX_TARGET_PERCENT;
    }

    /// @dev returns the total deposited into asset strategy
    function getTotalDeposited() public view returns (uint256) {
        return
            getTotalDelegated() +
            totalAssets() +
            _pendingWithdrawalAmount -
            depositBonusAmount;
    }

    function getTotalDelegated() public view returns (uint256 total) {
        uint256 stakersNum = restakers.length;
        for (uint256 i = 0; i < stakersNum; ++i) {
            if (restakers[i] == address(0)) continue;
            total += strategy.userUnderlyingView(restakers[i]);
        }
        return total + strategy.userUnderlyingView(address(this));
    }

    function forceUndelegateRecovery(
        uint256 amount,
        address restaker
    ) external {
        //   if (restaker == address(0)) revert NullParams();
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
        // if (_stakerImplementation == address(0)) revert ImplementationNotSet();
        // deploy new beacon proxy and do init call
        bytes memory data = abi.encodeWithSignature(
            "initialize(address,address,address,address)",
            delegationManager,
            strategyManager,
            strategy,
            _operator
        );
        address deployedAddress = address(new BeaconProxy(address(this), data));

        IOwnable asOwnable = IOwnable(deployedAddress);

        /// TODO
        //asOwnable.transferOwnership(owner());

        emit IInceptionVault_EL.RestakerDeployed(deployedAddress);
        return deployedAddress;
    }

    /// @dev returns the balance of iVault in the asset
    function totalAssets() public view returns (uint256) {
        return _asset.balanceOf(address(this));
    }
}

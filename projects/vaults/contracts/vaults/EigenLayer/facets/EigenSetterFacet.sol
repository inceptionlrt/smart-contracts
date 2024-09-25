// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "../InceptionVaultStorage_EL.sol";

contract EigenSetterFacet is InceptionVaultStorage_EL {
    function upgradeTo(address newImplementation) external {
        if (!Address.isContract(newImplementation)) revert NotContract();

        emit IInceptionVault_EL.ImplementationUpgraded(
            stakerImplementation,
            newImplementation
        );
        stakerImplementation = newImplementation;
    }

    function setProtocolFee(uint64 newProtocolFee) external {
        if (newProtocolFee >= MAX_PERCENT)
            revert ParameterExceedsLimits(newProtocolFee);

        emit IInceptionVault_EL.ProtocolFeeChanged(protocolFee, newProtocolFee);
        protocolFee = newProtocolFee;
    }

    function setTreasuryAddress(address newTreasury) external {
        if (newTreasury == address(0)) revert NullParams();

        emit IInceptionVault_EL.TreasuryChanged(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setRatioFeed(IInceptionRatioFeed newRatioFeed) external {
        if (address(newRatioFeed) == address(0)) revert NullParams();

        emit IInceptionVault_EL.RatioFeedChanged(
            address(ratioFeed),
            address(newRatioFeed)
        );
        ratioFeed = newRatioFeed;
    }

    function setOperator(address newOperator) external {
        if (newOperator == address(0)) revert NullParams();

        emit IInceptionVault_EL.OperatorChanged(_operator, newOperator);
        _operator = newOperator;
    }

    function setMinAmount(uint256 newMinAmount) external {
        emit IInceptionVault_EL.MinAmountChanged(minAmount, newMinAmount);
        minAmount = newMinAmount;
    }

    function setName(string memory newVaultName) external {
        if (bytes(newVaultName).length == 0) revert NullParams();

        emit IInceptionVault_EL.NameChanged(name, newVaultName);
        name = newVaultName;
    }

    function addELOperator(address newELOperator) external {
        if (!delegationManager.isOperator(newELOperator))
            revert NotEigenLayerOperator();

        if (_operatorRestakers[newELOperator] != address(0))
            revert EigenLayerOperatorAlreadyExists();

        _operatorRestakers[newELOperator] = _MOCK_ADDRESS;
        emit IInceptionVault_EL.ELOperatorAdded(newELOperator);
    }

    function setDelegationManager(
        IDelegationManager newDelegationManager
    ) external {
        if (address(delegationManager) != address(0))
            revert DelegationManagerImmutable();

        emit IInceptionVault_EL.DelegationManagerChanged(
            address(delegationManager),
            address(newDelegationManager)
        );
        delegationManager = newDelegationManager;
    }

    function setTargetFlashCapacity(uint256 newTargetCapacity) external {
        emit IInceptionVault_EL.TargetCapacityChanged(
            targetCapacity,
            newTargetCapacity
        );
        targetCapacity = newTargetCapacity;
    }

    function setDepositBonusParams(
        uint64 newMaxBonusRate,
        uint64 newOptimalBonusRate,
        uint64 newDepositUtilizationKink
    ) external {
        if (newMaxBonusRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newMaxBonusRate);
        if (newOptimalBonusRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newOptimalBonusRate);
        if (newDepositUtilizationKink > MAX_PERCENT)
            revert ParameterExceedsLimits(newDepositUtilizationKink);

        maxBonusRate = newMaxBonusRate;
        optimalBonusRate = newOptimalBonusRate;
        depositUtilizationKink = newDepositUtilizationKink;

        emit IInceptionVault_EL.DepositBonusParamsChanged(
            newMaxBonusRate,
            newOptimalBonusRate,
            newDepositUtilizationKink
        );
    }

    function setFlashWithdrawFeeParams(
        uint64 newMaxFlashFeeRate,
        uint64 newOptimalWithdrawalRate,
        uint64 newWithdrawUtilizationKink
    ) external {
        if (newMaxFlashFeeRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newMaxFlashFeeRate);
        if (newOptimalWithdrawalRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newOptimalWithdrawalRate);
        if (newWithdrawUtilizationKink > MAX_PERCENT)
            revert ParameterExceedsLimits(newWithdrawUtilizationKink);

        maxFlashFeeRate = newMaxFlashFeeRate;
        optimalWithdrawalRate = newOptimalWithdrawalRate;
        withdrawUtilizationKink = newWithdrawUtilizationKink;

        emit IInceptionVault_EL.WithdrawFeeParamsChanged(
            newMaxFlashFeeRate,
            newOptimalWithdrawalRate,
            newWithdrawUtilizationKink
        );
    }

    /// @dev setRewardsTimeline ...
    /// @dev newTimelineInDays is measured in seconds
    function setRewardsTimeline(
        uint256 newTimelineInSeconds
    ) external onlyOwner {
        if (newTimelineInSeconds < 1 days) revert InconsistentData();

        emit IInceptionVault_EL.RewardsTimelineChanged(
            rewardsTimeline,
            newTimelineInSeconds
        );
        rewardsTimeline = newTimelineInSeconds;
    }
}

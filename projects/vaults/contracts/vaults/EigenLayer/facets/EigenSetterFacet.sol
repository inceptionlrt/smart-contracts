// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "../InceptionVaultStorage_EL.sol";

contract EigenSetterFacet is InceptionVaultStorage_EL {
    function upgradeTo(address newImplementation) external {
        if (!Address.isContract(newImplementation)) revert NotContract();

        emit ImplementationUpgraded(stakerImplementation, newImplementation);
        stakerImplementation = newImplementation;
    }

    function setProtocolFee(uint64 newProtocolFee) external {
        if (newProtocolFee >= MAX_PERCENT)
            revert ParameterExceedsLimits(newProtocolFee);

        emit ProtocolFeeChanged(protocolFee, newProtocolFee);
        protocolFee = newProtocolFee;
    }

    function setTreasuryAddress(address newTreasury) external {
        if (newTreasury == address(0)) revert NullParams();

        emit TreasuryChanged(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setRatioFeed(IInceptionRatioFeed newRatioFeed) external {
        if (address(newRatioFeed) == address(0)) revert NullParams();

        emit RatioFeedChanged(address(ratioFeed), address(newRatioFeed));
        ratioFeed = newRatioFeed;
    }

    function setOperator(address newOperator) external {
        if (newOperator == address(0)) revert NullParams();

        emit OperatorChanged(_operator, newOperator);
        _operator = newOperator;
    }

    function setMinAmount(uint256 newMinAmount) external {
        emit MinAmountChanged(minAmount, newMinAmount);
        minAmount = newMinAmount;
    }

    function setName(string memory newVaultName) external {
        if (bytes(newVaultName).length == 0) revert NullParams();

        emit NameChanged(name, newVaultName);
        name = newVaultName;
    }

    function addELOperator(address newELOperator) external {
        if (!delegationManager.isOperator(newELOperator))
            revert NotEigenLayerOperator();

        if (_operatorRestakers[newELOperator] != address(0))
            revert EigenLayerOperatorAlreadyExists();

        _operatorRestakers[newELOperator] = _MOCK_ADDRESS;
        emit ELOperatorAdded(newELOperator);
    }

    function setDelegationManager(
        IDelegationManager newDelegationManager
    ) external {
        if (address(delegationManager) != address(0))
            revert DelegationManagerImmutable();

        emit DelegationManagerChanged(
            address(delegationManager),
            address(newDelegationManager)
        );
        delegationManager = newDelegationManager;
    }

    function setTargetFlashCapacity(uint256 newTargetCapacity) external {
        emit TargetCapacityChanged(targetCapacity, newTargetCapacity);
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

        emit DepositBonusParamsChanged(
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

        emit WithdrawFeeParamsChanged(
            newMaxFlashFeeRate,
            newOptimalWithdrawalRate,
            newWithdrawUtilizationKink
        );
    }

    /**
     * @param newTimelineInSeconds is measured in seconds
     */
    function setRewardsTimeline(uint256 newTimelineInSeconds) external {
        if (newTimelineInSeconds < 1 days) revert InconsistentData();

        emit RewardsTimelineChanged(rewardsTimeline, newTimelineInSeconds);
        rewardsTimeline = newTimelineInSeconds;
    }
}

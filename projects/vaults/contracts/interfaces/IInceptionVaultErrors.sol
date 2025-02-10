// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInceptionVaultErrors {
    error TransferAssetFailed(address assetAddress);

    error TransferAssetFromFailed(address assetAddress);

    error InsufficientCapacity(uint256 capacity);

    error InceptionOnPause();

    error InconsistentData();

    error ApproveError();

    error NullParams();

    error ParameterExceedsLimits(uint256 param);

    error NotContract();

    error DepositInconsistentResultedState();

    error OperatorNotRegistered();

    error RestakerNotRegistered();

    error ImplementationNotSet();

    error OnlyOperatorAllowed();

    error AlreadyDelegated();

    error DelegationManagerImmutable();

    error IsNotAbleToRedeem();

    error LowerMinAmount(uint256 minAmount);

    error ZeroFlashWithdrawFee();

    /// TVL errors

    error ExceedsMaxPerDeposit(uint256 max, uint256 amount);

    error ExceedsMaxTotalDeposited(uint256 max, uint256 amount);

    /// EigenLayer Operators

    error NotEigenLayerOperator();

    error EigenLayerOperatorAlreadyExists();
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInceptionVaultErrors {
    error ExceededMaxMint(address receiver, uint256 shares, uint256 maxShares);

    error MsgSenderIsNotOwner();

    error FunctionNotSupported();

    error TransferAssetFailed(address assetAddress);

    error TransferAssetFromFailed(address assetAddress);

    error InsufficientCapacity(uint256 capacity);

    error InvalidTargetFlashCapacity();

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

    error TimelineNotOver();

    error InvalidAddress();

    error MoreThanMax();
    
    error ValueZero();
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInceptionVaultErrors {
    error TransferAssetFailed(address assetAddress);

    error TransferAssetFromFailed(address assetAddress);

    error InsufficientCapacity(uint256 capacity);

    error InconsistentData();

    error NullParams();

    error WithdrawFutile();

    error OperatorNotRegistered();

    error RestakerNotRegistered();

    error ImplementationNotSet();

    error NotEigenLayerOperator();

    error EigenLayerOperatorAlreadyExists();

    error AlreadyDelegated();

    /// TVL errors

    error ExceedsMaxPerDeposit(uint256 max, uint256 amount);

    error ExceedsMaxTotalDeposited(uint256 max, uint256 amount);
}

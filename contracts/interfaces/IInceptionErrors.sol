// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IInceptionErrors {
    error TransferAssetFailed(address assetAddress);

    error TransferAssetFromFailed(address assetAddress);

    error InsufficientCapacity(uint256 capacity);

    error InconsistentData();

    error NullParams();

    error WithdrawFutile();

    error OperatorNotRegistered();

    error ImplementationNotSet();

    /// TVL errors

    error ExceedsMaxPerDeposit(uint256 max, uint256 amount);

    error ExceedsMaxTotalDeposited(uint256 max, uint256 amount);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IInceptionErrors {
    error AssetNotSupported(address assetAddress);

    error TransferAssetFailed(address assetAddress);

    error TransferAssetFromFailed(address assetAddress);

    error InsufficientCapacity(uint256 capacity);

    error ProportionWrong();

    error RebalanceInProgress();

    error RebalanceNotInProgress();

    error InconsistentData();

    error NullParams();

    error RebalanceDecreasedCapacity();

    error RebalanceFailed();

    error WithdrawFutile();
}

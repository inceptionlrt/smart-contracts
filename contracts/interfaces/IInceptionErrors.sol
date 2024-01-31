// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IInceptionErrors {
    error TransferAssetFailed(address assetAddress);

    error TransferAssetFromFailed(address assetAddress);

    error RebalanceInProgress();

    error RebalanceNotInProgress();

    error InconsistentData();

    error NullParams();

    error WithdrawFutile();

    error WrongEpoch();
}

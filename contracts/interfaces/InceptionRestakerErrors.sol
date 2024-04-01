// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface InceptionRestakerErrors {
    error TransferAssetFailed(address assetAddress);

    error InconsistentData();

    error WrongClaimWithdrawalParams();

    error NullParams();
}

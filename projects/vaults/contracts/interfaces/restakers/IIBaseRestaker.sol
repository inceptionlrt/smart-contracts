// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IIBaseRestaker {
    /************************************
     ************** Errors **************
     ************************************/

    error ValueZero();

    error TransferAssetFailed(address assetAddress);

    error InconsistentData();

    error WrongClaimWithdrawalParams();

    error NullParams();

    error NotVaultOrTrusteeManager();

    error LengthMismatch();

    error InvalidVault();

    error ZeroAddress();

    error AlreadyAdded();

    error NotContract();

    error InvalidDataLength(uint256 expected, uint256 received);

    /************************************
     ************** Events **************
     ************************************/

    event VaultSet(address indexed oldVault, address indexed newVault);

    event TrusteeManagerSet(
        address indexed _trusteeManager,
        address indexed _newTrusteeManager
    );

    function pendingWithdrawalAmount() external view returns (uint256);

    function getDeposited(address vaultAddress) external view returns (uint256);

    function getTotalDeposited() external view returns (uint256);

    function claimableAmount() external view returns (uint256);
}

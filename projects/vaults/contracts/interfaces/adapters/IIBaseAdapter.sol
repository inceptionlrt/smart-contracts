// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IIBaseAdapter {
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

    function delegate(address vault, uint256 amount, bytes[] calldata _data) external returns (uint256 depositedAmount);

    function withdraw(address vault, uint256 shares, bytes[] calldata _data) external returns (uint256);

    function claim(bytes[] calldata _data) external returns (uint256);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IIEigenRestakerErrors {
    error BadMellowWithdrawRequest();

    error ValueZero();

    error TransferAssetFailed(address assetAddress);

    error InconsistentData();

    error WrongClaimWithdrawalParams();

    error NullParams();

    error NotVaultOrTrusteeManager();

    error InvalidWrapperForVault();

    error LengthMismatch();

    error InactiveWrapper();

    error InvalidVault();

    error ZeroAddress();

    error NoWrapperExists();

    error InvalidAllocation();

    error TooMuchSlippage();

    error AlreadyAdded();

    error NotContract();
}

interface IISymbioticRestaker {
    event VaultSet(address indexed oldVault, address indexed newVault);

    event RequestDealineSet(
        uint256 indexed oldDeadline,
        uint256 indexed newDealine
    );

    event TrusteeManagerSet(
        address indexed _trusteeManager,
        address indexed _newTrusteeManager
    );

    event VaultAdded(address indexed vault);

    function getDeposited(address _mellowVault) external view returns (uint256);

    function getTotalDeposited() external view returns (uint256);

    function delegate(uint256 amount, address vaultAddress)
        external
        returns (uint256 depositedAmount, uint256 mintedShares);

    function withdraw(address vaultAddress, uint256 amount)
        external
        returns (uint256);

    function claim(address vault, uint256 epoch) external returns (uint256);

    function pendingWithdrawalAmount() external view returns (uint256);

    function claimableAmount() external view returns (uint256);
}

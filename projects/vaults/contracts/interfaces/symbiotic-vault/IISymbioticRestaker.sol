// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IMellowVault} from "./mellow-core/IMellowVault.sol";

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
}

interface IISymbioticRestaker {
    event AllocationChanged(
        address mellowVault,
        uint256 oldAllocation,
        uint256 newAllocation
    );

    event VaultSet(address indexed oldVault, address indexed newVault);

    event RequestDealineSet(
        uint256 indexed oldDeadline,
        uint256 indexed newDealine
    );

    event TrusteeManagerSet(
        address indexed _trusteeManager,
        address indexed _newTrusteeManager
    );

    event WrappedSet(address indexed _wrapped, address indexed _newWrapped);

    event VaultAdded(
        address indexed _mellowVault,
        address indexed _depositWrapper
    );

    event WrapperChanged(
        address indexed _mellowVault,
        address indexed _oldWrapper,
        address indexed _newWrapper
    );

    function getDeposited(address _mellowVault) external view returns (uint256);

    function getTotalDeposited() external view returns (uint256);

    function delegateToVault(uint256 amount, address vaultAddress)
        external
        returns (uint256 depositedAmount, uint256 mintedShares);

    function withdrawFromVault(address vaultAddress, uint256 amount)
        external
        returns (uint256);

    function claimWithdrawal(uint256 epoch) external returns (uint256);

    function pendingMellowRequest(IMellowVault mellowVault)
        external
        returns (IMellowVault.WithdrawalRequest memory);

    function pendingWithdrawalAmount() external view returns (uint256);

    function claimableAmount() external view returns (uint256);
}

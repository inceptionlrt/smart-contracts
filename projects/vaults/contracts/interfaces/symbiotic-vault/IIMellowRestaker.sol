// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

    error LengthMismatch();

    error InactiveWrapper();

    error InvalidVault();

    error ZeroAddress();

    error InvalidAllocation();

    error TooMuchSlippage();
}

interface IIMellowRestaker {
    event AllocationChanged(
        address mellowVault,
        uint256 oldAllocation,
        uint256 newAllocation
    );

    event VaultSet(address indexed oldVault, address indexed newVault);
    
    event RequestDealineSet(uint256 indexed oldDeadline, uint256 indexed newDealine);

    event NewSlippages(uint256 _deposit, uint256 _withdraw);

    event TrusteeManagerSet(address indexed _trusteeManager, address indexed _newTrusteeManager);

    event WrappedSet(address indexed _wrapped, address indexed _newWrapped);
    
    function getDeposited(address _mellowVault) external view returns (uint256);

    function getTotalDeposited() external view returns (uint256);

    function delegateMellow(
        uint256 amount,
        uint256 deadline,
        address mellowVault
    ) external returns (uint256 lpAmount);

    function delegate(
        uint256 deadline
    ) external returns (uint256 amount, uint256 lpAmount);

    function withdrawMellow(
        address mellowVault,
        uint256 minLpAmount,
        bool closePrevious
    ) external returns (uint256);

    
    function withdrawEmergencyMellow(
        address _mellowVault,
        uint256 amount
    ) external returns (uint256);

    function claimMellowWithdrawalCallback() external returns (uint256);

    function pendingMellowRequest(
        IMellowVault mellowVault
    ) external returns (IMellowVault.WithdrawalRequest memory);

    function pendingWithdrawalAmount() external view returns (uint256);

    function claimableAmount() external view returns (uint256);
}
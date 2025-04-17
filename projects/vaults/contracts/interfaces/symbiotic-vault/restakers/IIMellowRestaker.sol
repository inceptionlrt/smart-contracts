// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IMellowVault} from "../mellow-core/IMellowVault.sol";
import {IIBaseRestaker} from "./IIBaseRestaker.sol";

interface IIMellowRestaker is IIBaseRestaker {
    error InactiveWrapper();
    error NoWrapperExists();
    error BadMellowWithdrawRequest();
    error InvalidWrapperForVault();
    error InvalidAllocation();
    error TooMuchSlippage();
    error AlreadyDeactivated();

    event AllocationChanged(
        address mellowVault,
        uint256 oldAllocation,
        uint256 newAllocation
    );

    event EthWrapperChanged(address indexed _old, address indexed _new);

    event DeactivatedMellowVault(address indexed _mellowVault);

    event VaultAdded(address indexed _mellowVault);

    function delegateMellow(
        uint256 amount,
        address mellowVault,
        address referral
    ) external returns (uint256 lpAmount);

    function delegate(
        uint256 amount,
        address referral
    ) external returns (uint256 lpAmount);

    function withdrawMellow(
        address mellowVault,
        uint256 amount
    ) external returns (uint256);

    function claimMellowWithdrawalCallback() external returns (uint256);
    function claimableWithdrawalAmount() external view returns (uint256);

    function pendingMellowRequest(
        IMellowVault mellowVault
    ) external returns (IMellowVault.WithdrawalRequest memory);
}

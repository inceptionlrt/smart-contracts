// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IMellowVault} from "../symbiotic-vault/mellow-core/IMellowVault.sol";
import {IIBaseAdapter} from "./IIBaseAdapter.sol";

interface IIMellowAdapter is IIBaseAdapter {
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

    event VaultAdded(address indexed _mellowVault);

    event DeactivatedMellowVault(address indexed _mellowVault);

    event EthWrapperChanged(address indexed _old, address indexed _new);

    function delegate(
        address mellowVault,
        uint256 amount,
        bytes calldata _data
    ) external returns (uint256 lpAmount);

    function delegateAuto(uint256 amount, address referral)
        external
        returns (uint256 tokenAmount, uint256 lpAmount);

    function withdraw(
        address vault,
        uint256 amount,
        bytes calldata _data
    ) external returns (uint256);

    function claim(bytes calldata _data) external returns (uint256);

    function pendingMellowRequest(IMellowVault mellowVault)
        external
        returns (IMellowVault.WithdrawalRequest memory);

    function claimableWithdrawalAmount() external view returns (uint256);
    function pendingWithdrawalAmount() external view returns (uint256);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IMellowVault} from "../mellow-core/IMellowVault.sol";
import {IIBaseRestaker} from "./IIBaseRestaker.sol";

interface IIMellowMultiVaultRestaker is IIBaseRestaker {
    /************************************
     ************** Events **************
     ************************************/

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

    event ClaimerChanged(address indexed _old, address indexed _new);

    /***************************************
     ************** Functions **************
     ***************************************/

    function delegate(
        address vault,
        uint256 amount,
        bytes[] calldata _data
    ) external returns (uint256 depositedAmount);

    function withdraw(
        address vault,
        uint256 amount,
        bytes[] calldata _data
    ) external returns (uint256);

    function claim(bytes[] calldata _data) external returns (uint256);
}


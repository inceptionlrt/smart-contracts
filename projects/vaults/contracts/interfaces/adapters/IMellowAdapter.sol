// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IMellowVault} from "../symbiotic-vault/mellow-core/IMellowVault.sol";
import {IBaseAdapter} from "./IBaseAdapter.sol";

interface IMellowAdapter is IBaseAdapter {
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

    event ClaimerChanged(address indexed _old, address indexed _new);

    function claimableWithdrawalAmount() external view returns (uint256);
}

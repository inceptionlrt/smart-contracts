// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IDelegationManager, IStrategy, IERC20} from "../eigenlayer-vault/eigen-core/IDelegationManager.sol";
import {IMellowVault} from "../symbiotic-vault/mellow-core/IMellowVault.sol";
import {IInceptionBaseAdapter} from "./IInceptionBaseAdapter.sol";

interface IInceptionEigenAdapterErrors {
    error OnlyTrusteeAllowed();

    error InconsistentData();

    error WrongClaimWithdrawalParams();

    error NullParams();
}

interface IInceptionEigenLayerAdapter is IInceptionBaseAdapter {
    event StartWithdrawal(
        address indexed stakerAddress,
        IStrategy strategy,
        uint256 shares,
        uint32 withdrawalStartBlock,
        address delegatedAddress,
        uint256 nonce
    );

    event Withdrawal(
        bytes32 withdrawalRoot,
        IStrategy[] strategies,
        uint256[] shares,
        uint32 withdrawalStartBlock
    );

    event RewardCoordinatorChanged(
        address indexed prevValue,
        address indexed newValue
    );

    event WithdrawalsQueued(bytes32[] withdrawalRoots);

    event Undelegated();

    event RedelegatedTo(address operator);

    function setRewardsCoordinator(address newRewardCoordinator, address claimer) external;
}

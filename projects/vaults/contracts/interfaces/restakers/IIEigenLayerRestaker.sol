// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IDelegationManager, IStrategy, IERC20} from "../eigenlayer-vault/eigen-core/IDelegationManager.sol";
import {IMellowVault} from "../symbiotic-vault/mellow-core/IMellowVault.sol";
import {IIBaseRestaker} from "./IIBaseRestaker.sol";

interface IInceptionEigenRestakerErrors {
    error OnlyTrusteeAllowed();

    error InconsistentData();

    error WrongClaimWithdrawalParams();

    error NullParams();
}

interface IIEigenLayerRestaker is IIBaseRestaker {
    event StartWithdrawal(
        address indexed stakerAddress,
        bytes32 withdrawalRoot,
        IStrategy[] strategies,
        uint256[] shares,
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

    // function depositAssetIntoStrategy(uint256 amount) external;

    function delegate(
        address operator,
        uint256 amount,
        bytes[] calldata _data
    ) external returns (uint256);

    function withdraw(
        address, /*vault*/
        uint256 shares,
        bytes[] calldata _data
    ) external;

    function claim(bytes[] calldata _data) external returns (uint256);

    function setRewardsCoordinator(address newRewardCoordinator) external;
}

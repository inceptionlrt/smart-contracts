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

    function depositAssetIntoStrategy(uint256 amount) external;

    function delegateToOperator(
        address operator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) external;

    function withdrawFromEL(uint256 shares) external;

    function claimWithdrawals(
        IDelegationManager.Withdrawal[] calldata withdrawals,
        IERC20[][] calldata tokens,
        uint256[] calldata middlewareTimesIndexes,
        bool[] calldata receiveAsTokens
    ) external returns (uint256);

    function setRewardsCoordinator(address newRewardCoordinator) external;
}

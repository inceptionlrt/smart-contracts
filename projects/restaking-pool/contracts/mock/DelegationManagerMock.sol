// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IDelegationManager.sol";
import "hardhat/console.sol";

contract DelegationManagerMock is IDelegationManager {
    function delegateTo(
        address operator,
        SignatureWithExpiry memory approverSignatureAndExpiry,
        bytes32 approverSalt
    ) external override {}

    function delegateToBySignature(
        address staker,
        address operator,
        SignatureWithExpiry memory stakerSignatureAndExpiry,
        SignatureWithExpiry memory approverSignatureAndExpiry,
        bytes32 approverSalt
    ) external override {}

    function queueWithdrawals(
        QueuedWithdrawalParams[] calldata queuedWithdrawalParams
    ) external override returns (bytes32[] memory) {}

    function completeQueuedWithdrawal(
        Withdrawal calldata withdrawal,
        IERC20[] calldata tokens,
        uint256 middlewareTimesIndex,
        bool receiveAsTokens
    ) external override {}

    function completeQueuedWithdrawals(
        Withdrawal[] calldata withdrawals,
        IERC20[][] calldata tokens,
        uint256[] calldata middlewareTimesIndexes,
        bool[] calldata receiveAsTokens
    ) external override {}

    function delegatedTo(
        address staker
    ) external view override returns (address) {}

    function operatorDetails(
        address operator
    ) external view override returns (OperatorDetails memory) {}

    function earningsReceiver(
        address operator
    ) external view override returns (address) {}

    function delegationApprover(
        address operator
    ) external view override returns (address) {}

    function stakerOptOutWindowBlocks(
        address operator
    ) external view override returns (uint256) {}

    function operatorShares(
        address operator,
        IStrategy strategy
    ) external view override returns (uint256) {}

    function isDelegated(
        address staker
    ) external view override returns (bool) {}

    function isOperator(
        address operator
    ) external view override returns (bool) {}

    function stakerNonce(
        address staker
    ) external view override returns (uint256) {}

    function delegationApproverSaltIsSpent(
        address _delegationApprover,
        bytes32 salt
    ) external view override returns (bool) {}

    function calculateCurrentStakerDelegationDigestHash(
        address staker,
        address operator,
        uint256 expiry
    ) external view override returns (bytes32) {}

    function calculateStakerDelegationDigestHash(
        address staker,
        uint256 _stakerNonce,
        address operator,
        uint256 expiry
    ) external view override returns (bytes32) {}

    function calculateDelegationApprovalDigestHash(
        address staker,
        address operator,
        address _delegationApprover,
        bytes32 approverSalt,
        uint256 expiry
    ) external view override returns (bytes32) {}

    function DOMAIN_TYPEHASH() external view override returns (bytes32) {}

    function STAKER_DELEGATION_TYPEHASH()
        external
        view
        override
        returns (bytes32)
    {}

    function DELEGATION_APPROVAL_TYPEHASH()
        external
        view
        override
        returns (bytes32)
    {}

    function domainSeparator() external view override returns (bytes32) {}

    function cumulativeWithdrawalsQueued(
        address staker
    ) external view override returns (uint256) {}

    function calculateWithdrawalRoot(
        Withdrawal memory withdrawal
    ) external pure override returns (bytes32) {}

    function migrateQueuedWithdrawals(
        IStrategyManager.DeprecatedStruct_QueuedWithdrawal[]
            memory withdrawalsToQueue
    ) external override {}

    function registerAsOperator(
        OperatorDetails calldata registeringOperatorDetails,
        string calldata metadataURI
    ) external override {}

    function modifyOperatorDetails(
        OperatorDetails calldata newOperatorDetails
    ) external override {}

    function updateOperatorMetadataURI(
        string calldata metadataURI
    ) external override {}

    function undelegate(
        address staker
    ) external override returns (bytes32[] memory withdrawalRoot) {}

    function increaseDelegatedShares(
        address staker,
        IStrategy strategy,
        uint256 shares
    ) external override {}

    function decreaseDelegatedShares(
        address staker,
        IStrategy strategy,
        uint256 shares
    ) external override {}

    function getOperatorShares(
        address operator,
        IStrategy[] memory strategies
    ) external view override returns (uint256[] memory) {}

    function getWithdrawalDelay(
        IStrategy[] calldata strategies
    ) external view override returns (uint256) {}

    function minWithdrawalDelayBlocks()
        external
        view
        override
        returns (uint256)
    {}

    function strategyWithdrawalDelayBlocks(
        IStrategy strategy
    ) external view override returns (uint256) {}
}

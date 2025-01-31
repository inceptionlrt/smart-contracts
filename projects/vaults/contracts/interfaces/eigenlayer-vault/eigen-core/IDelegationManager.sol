// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IStrategy.sol";

interface IDelegationManagerErrors {
    /// @dev Thrown when caller is neither the StrategyManager or EigenPodManager contract.
    error OnlyStrategyManagerOrEigenPodManager();
    /// @dev Thrown when msg.sender is not the EigenPodManager
    error OnlyEigenPodManager();
    /// @dev Throw when msg.sender is not the AllocationManager
    error OnlyAllocationManager();

    /// Delegation Status

    /// @dev Thrown when an operator attempts to undelegate.
    error OperatorsCannotUndelegate();
    /// @dev Thrown when an account is actively delegated.
    error ActivelyDelegated();
    /// @dev Thrown when an account is not actively delegated.
    error NotActivelyDelegated();
    /// @dev Thrown when `operator` is not a registered operator.
    error OperatorNotRegistered();

    /// Invalid Inputs

    /// @dev Thrown when attempting to execute an action that was not queued.
    error WithdrawalNotQueued();
    /// @dev Thrown when caller cannot undelegate on behalf of a staker.
    error CallerCannotUndelegate();
    /// @dev Thrown when two array parameters have mismatching lengths.
    error InputArrayLengthMismatch();
    /// @dev Thrown when input arrays length is zero.
    error InputArrayLengthZero();

    /// Slashing

    /// @dev Thrown when an operator has been fully slashed(maxMagnitude is 0) for a strategy.
    /// or if the staker has had been natively slashed to the point of their beaconChainScalingFactor equalling 0.
    error FullySlashed();

    /// Signatures

    /// @dev Thrown when attempting to spend a spent eip-712 salt.
    error SaltSpent();

    /// Withdrawal Processing

    /// @dev Thrown when attempting to withdraw before delay has elapsed.
    error WithdrawalDelayNotElapsed();
    /// @dev Thrown when a withdraw amount larger than max is attempted.
    error WithdrawalExceedsMax();
    /// @dev Thrown when withdrawer is not the current caller.
    error WithdrawerNotCaller();
    /// @dev Thrown when `withdrawer` is not staker.
    error WithdrawerNotStaker();
}

interface IDelegationManager is IDelegationManagerErrors {
    // @notice Struct that bundles together a signature and an expiration time for the signature. Used primarily for stack management.
    struct SignatureWithExpiry {
        // the signature itself, formatted as a single bytes object
        bytes signature;
        // the expiration timestamp (UTC) of the signature
        uint256 expiry;
    }

    // @notice Struct that bundles together a signature, a salt for uniqueness, and an expiration time for the signature. Used primarily for stack management.
    struct SignatureWithSaltAndExpiry {
        // the signature itself, formatted as a single bytes object
        bytes signature;
        // the salt used to generate the signature
        bytes32 salt;
        // the expiration timestamp (UTC) of the signature
        uint256 expiry;
    }

    struct QueuedWithdrawalParams {
        // Array of strategies that the QueuedWithdrawal contains
        IStrategy[] strategies;
        // Array containing the amount of shares in each Strategy in the `strategies` array
        uint256[] shares;
        // The address of the withdrawer
        address withdrawer;
    }

    struct Withdrawal {
        // The address that originated the Withdrawal
        address staker;
        // The address that the staker was delegated to at the time that the Withdrawal was created
        address delegatedTo;
        // The address that can complete the Withdrawal + will receive funds when completing the withdrawal
        address withdrawer;
        // Nonce used to guarantee that otherwise identical withdrawals have unique hashes
        uint256 nonce;
        // Block number when the Withdrawal was created
        uint32 startBlock;
        // Array of strategies that the Withdrawal contains
        IStrategy[] strategies;
        // Array containing the amount of shares in each Strategy in the `strategies` array
        uint256[] shares;
    }

    function delegateTo(
        address operator,
        SignatureWithExpiry memory approverSignatureAndExpiry,
        bytes32 approverSalt
    ) external;

    function undelegate(address staker) external;

    /**
     * @notice Emitted when a new withdrawal is queued.
     * @param withdrawalRoot Is the hash of the `withdrawal`.
     * @param withdrawal Is the withdrawal itself.
     * @param sharesToWithdraw Is an array of the expected shares that were queued for withdrawal corresponding to the strategies in the `withdrawal`.
     */
    event SlashingWithdrawalQueued(bytes32 withdrawalRoot, Withdrawal withdrawal, uint256[] sharesToWithdraw);

    function completeQueuedWithdrawal(
        Withdrawal calldata withdrawal,
        IERC20[] calldata tokens,
        bool receiveAsTokens
    ) external;

    function completeQueuedWithdrawals(
        IDelegationManager.Withdrawal[] calldata withdrawals,
        IERC20[][] calldata tokens,
        bool[] calldata receiveAsTokens
    ) external;

    function queueWithdrawals(
        QueuedWithdrawalParams[] calldata queuedWithdrawalParams
    ) external returns (bytes32[] memory);

    function delegatedTo(address staker) external view returns (address);

    function operatorShares(address operator, address strategy)
        external
        view
        returns (uint256);

    function cumulativeWithdrawalsQueued(address staker)
        external
        view
        returns (uint256);

    function withdrawalDelayBlocks() external view returns (uint256);

    function isOperator(address operator) external view returns (bool);

    function isDelegated(address staker) external view returns (bool);

    function getWithdrawableShares(
        address staker,
        IStrategy[] memory strategies
    ) external view returns (uint256[] memory withdrawableShares, uint256[] memory depositShares);

    function redelegate(
        address newOperator,
        SignatureWithExpiry memory newOperatorApproverSig,
        bytes32 approverSalt
    ) external returns (bytes32[] memory withdrawalRoots);
}

// SPDX-License-Identifier: BSL-1.1
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Arrays.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./IMellowVaultConfigurator.sol";

/**
 * @title IVault
 * @notice Interface defining core methods, constants, and errors for vault contracts.
 * Includes events, data structures, functions, and permissions required for managing the vault.
 * @dev Main contract of the system managing interactions between users, administrators, and operators.
 *      System parameters are set within the corresponding contract - VaultConfigurator.
 *      Upon deposit, LP tokens are issued to users based on asset valuation by oracles.
 *      Deposits are made through the deposit function, where a deposit can only be made in underlyingTokens and
 *      only at the specified ratiosOracle ratio. Deposits can be paused by setting the isDepositLocked flag.
 *
 *      Withdrawals can occur through two scenarios:
 *          - Regular withdrawal via the registerWithdrawal function and emergency withdrawal via the emergencyWithdraw function.
 *          In a regular withdrawal, the user registers a withdrawal request, after which the operator must perform a series of operations
 *          to ensure there are enough underlyingTokens on the vault's balance to fulfill the user's request. Subsequently, the operator must call
 *          the processWithdrawals function. If a user's request is not processed within the emergencyWithdrawalDelay period, the user can perform an emergency withdrawal.
 *          Note! In this case, the user may receive less funds than entitled by the system, as this function only handles ERC20 tokens in the system.
 *          Therefore, if the system has a base asset that is not represented as an ERC20 token, the corresponding portion of the funds will be lost by the user.
 *
 *      It is assumed that the main system management will occur through calls to delegateModules via delegateCalls on behalf of the operator.
 *      For this to be possible, certain conditions must be met:
 *          - From the validator's perspective, two conditions must be met:
 *              1. The caller must have the right to call the delegateCall function with the corresponding data parameter.
 *              2. The contract itself must be able to call the function on the delegateModule with the specified data.
 *          - From the configurator's perspective, the called module must have the appropriate approval - isDelegateModuleApproved.
 *
 *      If external calls need to be made, the externalCall function is used, for the execution of which a similar set of properties exists:
 *          - From the validator's perspective, two conditions must be met:
 *              1. The caller must have the right to call the externalCall function with the corresponding data parameter.
 *              2. The contract itself must be able to call the function on the external contract with the specified data.
 *          - From the configurator's perspective, the called contract must NOT have isDelegateModuleApproved permission.
 *
 *      Vault also has the functionality of adding and removing underlyingTokens, as well as tvlModules.
 *      For this purpose, the following functions are available, which can only be called by the vault's admin:
 *          - addToken
 *          - removeToken
 *          - addTvlModule
 *          - removeTvlModule
 *      Upon calling removeToken, it is checked that the underlyingTvl function for the specified token returns a zero value. Otherwise, the function reverts with a NonZeroValue error.
 *      It is important to note that there is no such check when calling removeTvlModule, so when updating parameters, sequential execution of a transaction to remove the old and add the new tvlModule is implied.
 */
abstract contract IMellowVault is IERC20 {
    /// @dev Errors
    error Deadline();
    error InvalidState();
    error InvalidLength();
    error InvalidToken();
    error NonZeroValue();
    error ValueZero();
    error InsufficientLpAmount();
    error InsufficientAmount();
    error LimitOverflow();
    error AlreadyAdded();

    IMellowVaultConfigurator public configurator;

    /// @notice Struct representing a user's withdrawal request.
    struct WithdrawalRequest {
        address to;
        uint256 lpAmount;
        bytes32 tokensHash; // keccak256 hash of the tokens array at the moment of request
        uint256[] minAmounts;
        uint256 deadline;
        uint256 timestamp;
    }

    /// @notice Struct representing the current state used for processing withdrawals.
    struct ProcessWithdrawalsStack {
        address[] tokens;
        uint128[] ratiosX96;
        uint256[] erc20Balances;
        uint256 totalSupply;
        uint256 totalValue;
        uint256 ratiosX96Value;
        uint256 timestamp;
        uint256 feeD9;
        bytes32 tokensHash; // keccak256 hash of the tokens array at the moment of the call
    }

    /// @notice 2^96, used for fixed-point arithmetic
    function Q96() external view virtual returns (uint256);

    /// @notice Multiplier of 1e9
    function D9() external view virtual returns (uint256);

    /// @notice Returns the withdrawal request of a given user.
    /// @param user The address of the user.
    /// @return request The withdrawal request associated with the user.
    function withdrawalRequest(
        address user
    ) external view virtual returns (WithdrawalRequest memory request);

    /// @return count The number of users with pending withdrawal requests.
    function pendingWithdrawersCount()
        external
        view
        virtual
        returns (uint256 count);

    /// @notice Returns an array of addresses with pending withdrawal requests.
    /// @return users An array of addresses with pending withdrawal requests.
    function pendingWithdrawers()
        external
        view
        virtual
        returns (address[] memory users);

    /// @notice Returns an array of addresses with pending withdrawal requests.
    /// @param limit The maximum number of users to return.
    /// @param offset The number of users to skip before returning.
    /// @return users An array of addresses with pending withdrawal requests.
    function pendingWithdrawers(
        uint256 limit,
        uint256 offset
    ) external view virtual returns (address[] memory users);

    /// @notice Returns an array of underlying tokens of the vault.
    /// @return underlyinigTokens_ An array of underlying token addresses.
    function underlyingTokens()
        external
        view
        virtual
        returns (address[] memory underlyinigTokens_);

    /// @notice Checks if a token is an underlying token of the vault.
    /// @return isUnderlyingToken_ true if the token is an underlying token of the vault.
    function isUnderlyingToken(
        address token
    ) external view virtual returns (bool isUnderlyingToken_);

    /// @notice Returns an array of addresses of all TVL modules.
    /// @return tvlModules_ An array of TVL module addresses.
    function tvlModules()
        external
        view
        virtual
        returns (address[] memory tvlModules_);

    /// @notice Calculates and returns the total value locked (TVL) of the underlying tokens.
    /// @return tokens An array of underlying token addresses.
    /// @return amounts An array of the amounts of each underlying token in the TVL.
    function underlyingTvl()
        external
        view
        virtual
        returns (address[] memory tokens, uint256[] memory amounts);

    /// @notice Calculates and returns the base TVL (Total Value Locked) across all tokens in the vault.
    /// @return tokens An array of token addresses.
    /// @return amounts An array of the amounts of each token in the base TVL.
    function baseTvl()
        external
        view
        virtual
        returns (address[] memory tokens, uint256[] memory amounts);

    /// @notice Adds a new token to the list of underlying tokens in the vault.
    /// @dev Only accessible by an admin.
    /// @param token The address of the token to add.
    function addToken(address token) external virtual;

    /// @notice Removes a token from the list of underlying tokens in the vault.
    /// @dev Only accessible by an admin.
    /// @param token The address of the token to remove.
    function removeToken(address token) external virtual;

    /// @notice Adds a new TVL module to the vault.
    /// @dev Only accessible by an admin.
    /// @param module The address of the TVL module to add.
    function addTvlModule(address module) external virtual;

    /// @notice Removes an existing TVL module from the vault.
    /// @dev Only accessible by an admin.
    /// @param module The address of the TVL module to remove.
    function removeTvlModule(address module) external virtual;

    /// @notice Performs an external call to a given address with specified data.
    /// @dev Only operators or admins should call this function. Checks access permissions.
    /// @param to The address to which the call will be made.
    /// @param data The calldata to use for the external call.
    /// @return success Indicates if the call was successful.
    /// @return response The response data from the external call.
    /// @dev Checks permissions using the validator from the configurator.
    function externalCall(
        address to,
        bytes calldata data
    ) external virtual returns (bool success, bytes memory response);

    /// @notice Executes a delegate call to a specified address with given data.
    /// @dev Only operators or admins should call this function. Checks access permissions.
    /// @param to The address to which the delegate call will be made.
    /// @param data The calldata to use for the delegate call.
    /// @return success Indicates if the delegate call was successful.
    /// @return response The response data from the delegate call.
    /// @dev Checks permissions using the validator from the configurator.
    function delegateCall(
        address to,
        bytes calldata data
    ) external virtual returns (bool success, bytes memory response);

    /// @notice Deposits specified amounts of tokens into the vault in exchange for LP tokens.
    /// @dev Only accessible when deposits are unlocked.
    /// @param to The address to receive LP tokens.
    /// @param amounts An array specifying the amounts for each underlying token.
    /// @param minLpAmount The minimum amount of LP tokens to mint.
    /// @param deadline The time before which the operation must be completed.
    /// @return actualAmounts The actual amounts deposited for each underlying token.
    /// @return lpAmount The amount of LP tokens minted.
    function deposit(
        address to,
        uint256[] memory amounts,
        uint256 minLpAmount,
        uint256 deadline
    )
        external
        virtual
        returns (uint256[] memory actualAmounts, uint256 lpAmount);

    /// @notice Handles emergency withdrawals, proportionally withdrawing all tokens in the system (not just the underlying).
    /// @dev Transfers tokens based on the user's share of lpAmount / totalSupply.
    /// @param minAmounts An array of minimum amounts expected for each underlying token.
    /// @param deadline The time before which the operation must be completed.
    /// @return actualAmounts The actual amounts withdrawn for each token.
    function emergencyWithdraw(
        uint256[] memory minAmounts,
        uint256 deadline
    ) external virtual returns (uint256[] memory actualAmounts);

    /// @notice Cancels a pending withdrawal request.
    function cancelWithdrawalRequest() external virtual;

    /// @notice Registers a new withdrawal request, optionally closing previous requests.
    /// @param to The address to receive the withdrawn tokens.
    /// @param lpAmount The amount of LP tokens to withdraw.
    /// @param minAmounts An array specifying minimum amounts for each token.
    /// @param deadline The time before which the operation must be completed.
    /// @param requestDeadline The deadline before which the request should be fulfilled.
    /// @param closePrevious Whether to close a previous request if it exists.
    function registerWithdrawal(
        address to,
        uint256 lpAmount,
        uint256[] memory minAmounts,
        uint256 deadline,
        uint256 requestDeadline,
        bool closePrevious
    ) external virtual;

    /// @notice Analyzes a withdrawal request based on the current vault state.
    /// @param s The current state stack to use for analysis.
    /// @param request The withdrawal request to analyze.
    /// @return processingPossible Whether processing is possible based on current vault state.
    /// @return withdrawalPossible Whether the withdrawal can be fulfilled.
    /// @return expectedAmounts The expected amounts to be withdrawn for each token.
    function analyzeRequest(
        ProcessWithdrawalsStack memory s,
        WithdrawalRequest memory request
    )
        external
        pure
        virtual
        returns (
            bool processingPossible,
            bool withdrawalPossible,
            uint256[] memory expectedAmounts
        );

    /// @notice Calculates and returns the state stack required for processing withdrawal requests.
    /// @return s The state stack with current vault balances and data.
    function calculateStack()
        external
        view
        virtual
        returns (ProcessWithdrawalsStack memory s);

    /// @notice Processes multiple withdrawal requests by fulfilling eligible withdrawals.
    /// @param users An array of user addresses whose withdrawal requests should be processed.
    /// @return statuses An array indicating the status of each user's withdrawal request.
    function processWithdrawals(
        address[] memory users
    ) external virtual returns (bool[] memory statuses);

    /**
     * @notice Emitted when a token is added to the vault.
     * @param token The address of the token added.
     */
    event TokenAdded(address token);

    /**
     * @notice Emitted when a token is removed from the vault.
     * @param token The address of the token removed.
     */
    event TokenRemoved(address token);

    /**
     * @notice Emitted when a TVL module is added to the vault.
     * @param module The address of the TVL module added.
     */
    event TvlModuleAdded(address module);

    /**
     * @notice Emitted when a TVL module is removed from the vault.
     * @param module The address of the TVL module removed.
     */
    event TvlModuleRemoved(address module);

    /**
     * @notice Emitted when an external call is made.
     * @param to The address of the contract called.
     * @param data The calldata of the call.
     * @param success The success status of the call.
     * @param response The response data of the call.
     */
    event ExternalCall(
        address indexed to,
        bytes data,
        bool success,
        bytes response
    );

    /**
     * @notice Emitted when a delegate call is made.
     * @param to The address of the contract called.
     * @param data The calldata of the call.
     * @param success The success status of the call.
     * @param response The response data of the call.
     */
    event DelegateCall(
        address indexed to,
        bytes data,
        bool success,
        bytes response
    );

    /**
     * @notice Emitted when a deposit occurs.
     * @param to The address where LP tokens are deposited.
     * @param amounts The amounts of tokens deposited.
     * @param lpAmount The amount of LP tokens minted.
     * @param referralCode The referral code used for the deposit.
     */
    event Deposit(
        address indexed to,
        uint256[] amounts,
        uint256 lpAmount,
        uint256 referralCode
    );

    /**
     * @notice Emitted when a deposit callback occurs.
     * @param callback The address of the deposit callback contract.
     * @param amounts The amounts of tokens deposited.
     * @param lpAmount The amount of LP tokens minted.
     */
    event DepositCallback(
        address indexed callback,
        uint256[] amounts,
        uint256 lpAmount
    );

    /**
     * @notice Emitted when a withdrawal request is made.
     * @param from The address of the user making the request.
     * @param request The details of the withdrawal request.
     */
    event WithdrawalRequested(address indexed from, WithdrawalRequest request);

    /**
     * @notice Emitted when a withdrawal request is canceled.
     * @param user The address of the user canceling the request.
     * @param origin The origin of the cancellation.
     */
    event WithdrawalRequestCanceled(address indexed user, address origin);

    /**
     * @notice Emitted when an emergency withdrawal occurs.
     * @param from The address of the user initiating the emergency withdrawal.
     * @param request The details of the withdrawal request.
     * @param amounts The actual amounts withdrawn.
     */
    event EmergencyWithdrawal(
        address indexed from,
        WithdrawalRequest request,
        uint256[] amounts
    );

    /**
     * @notice Emitted when withdrawals are processed.
     * @param users The addresses of the users whose withdrawals are processed.
     * @param statuses The statuses of the withdrawal processing.
     */
    event WithdrawalsProcessed(address[] users, bool[] statuses);

    /**
     * @notice Emitted when a withdrawal callback occurs.
     * @param callback The address of the withdrawal callback contract.
     */
    event WithdrawCallback(address indexed callback);
}

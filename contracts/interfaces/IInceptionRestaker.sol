// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IDelegationManager.sol";

interface IInceptionRestaker {
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

    function depositAssetIntoStrategy(uint256 amount) external;

    function delegateToOperator(
        address operator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) external;

    function withdrawFromEL(uint256 shares) external;

    function claimWithdrawal(
        IDelegationManager.Withdrawal[] calldata withdrawals,
        IERC20[][] calldata tokens,
        uint256[] calldata middlewareTimesIndexes,
        bool[] calldata receiveAsTokens
    ) external returns (uint256);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IInceptionAirdrop {
    /********************************************************
     ************************ Errors ************************
     */

    error OnlyOperatorAllowed();

    error AirdropAlreadyClaimed();

    error NoAirdropAvailable();

    error TokenTransferFailed();

    error ArrayLengthsMismatch();

    error NewOperatorZeroAddress();

    /********************************************************
     ************************ Events ************************
     */

    event TokenChanged(address indexed prevToken, address indexed newToken);

    event OperatorChanged(
        address indexed prevOperator,
        address indexed newOperator
    );

    event AirdropClaimed(address indexed claimer, uint256 amount);

    event AirdropUpdated(
        address indexed recipient,
        uint256 prevAmount,
        uint256 newAmount
    );
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IStrategyManager.sol";

interface IEigenLayerHandler {
    event StartWithdrawal(
        bytes32 withdrawalRoot,
        IStrategy[] strategies,
        uint256[] shares,
        uint32 withdrawalStartBlock,
        address delegatedAddress,
        uint96 nonce
    );

    event DepositedToEL(uint256 amount);

    event WithdrawalClaimed();
}

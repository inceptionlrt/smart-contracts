// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/interfaces/IERC4626Upgradeable.sol";

interface IInceptionVault {
    /*///////////////////
    ////// Events //////
    /////////////////*/

    event Deposit(
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        uint256 iShares
    );

    event Withdraw(
        address indexed sender,
        address indexed receiver,
        address indexed owner,
        uint256 amount,
        uint256 iShares
    );

    event Redeem(
        address indexed sender,
        address indexed receiver,
        uint256 amount
    );

    event WithdrawalQueued(
        address depositor,
        uint96 nonce,
        address withdrawer,
        address delegatedAddress,
        bytes32 withdrawalRoot
    );

    event OperatorChanged(address prevValue, address newValue);

    event DepositFeeChanged(uint256 prevValue, uint256 newValue);

    event MinAmountChanged(uint256 prevValue, uint256 newValue);

    event NameChanged(string prevValue, string newValue);

    event ReferralCode(bytes32 indexed code);
}

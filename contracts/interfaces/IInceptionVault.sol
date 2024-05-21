// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IInceptionToken.sol";

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

    event RedeemedRequests(uint256[] withdrawals);

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

    event ELOperatorAdded(address indexed newELOperator);

    event RestakerDeployed(address indexed restaker);

    event ImplementationUpgraded(address prevValue, address newValue);

    event NameChanged(string prevValue, string newValue);

    event ReferralCode(bytes32 indexed code);

    function inceptionToken() external view returns (IInceptionToken);

    function ratio() external view returns (uint256);
}

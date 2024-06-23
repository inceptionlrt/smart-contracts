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

    event FlashWithdraw(
        address indexed sender,
        address indexed receiver,
        address indexed owner,
        uint256 amount,
        uint256 iShares,
        uint256 fee
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

    event MinAmountChanged(uint256 prevValue, uint256 newValue);

    event ELOperatorAdded(address indexed newELOperator);

    event RestakerDeployed(address indexed restaker);

    event ImplementationUpgraded(address prevValue, address newValue);

    event RatioFeedChanged(address prevValue, address newValue);

    event NameChanged(string prevValue, string newValue);

    event TreasuryChanged(address prevValue, address newValue);

    event ReferralCode(bytes32 indexed code);

    event DepositBonus(uint256 amount);

    event UtilizationKinkChanged(uint256 prevValue, uint256 newValue);

    event DepositBonusParamsChanged(
        uint256 newMaxBonusRate,
        uint256 newOptimalBonusRate,
        uint256 newDepositUtilizationKink
    );

    event WithdrawFeeParamsChanged(
        uint256 newMaxFlashFeeRate,
        uint256 newOptimalWithdrawalRate,
        uint256 newWithdrawUtilizationKink
    );

    event ProtocolFeeChanged(uint256 prevValue, uint256 newValue);

    function inceptionToken() external view returns (IInceptionToken);

    function ratio() external view returns (uint256);
}

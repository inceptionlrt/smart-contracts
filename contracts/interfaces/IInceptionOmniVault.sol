// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInceptionOmniVault {
    /*///////////////////
    ////// Events //////
    /////////////////*/

    event Deposit(
        address indexed sender,
        address indexed receiver,
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

    event OperatorChanged(address prevValue, address newValue);

    event DepositFeeChanged(uint256 prevValue, uint256 newValue);

    event MinAmountChanged(uint256 prevValue, uint256 newValue);

    event TreasuryUpdated(address newTresury);

    event TargetCapacityChanged(uint256 prevValue, uint256 newValue);

    event RestakerDeployed(address indexed restaker);

    event ImplementationUpgraded(address prevValue, address newValue);

    event RatioFeedChanged(address prevValue, address newValue);

    event NameChanged(string prevValue, string newValue);

    event ReferralCode(bytes32 indexed code);

    event DepositBonus(uint256 amount);

    event FlashWithdrawFee(uint256 amount);

    function ratio() external view returns (uint256);
}

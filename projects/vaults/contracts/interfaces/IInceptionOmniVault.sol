// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInceptionOmniVault {
    /*///////////////////////////////////////////////////
    / ******************** Errors ******************** /
    /////////////////////////////////////////////////*/

    error TransferAssetFromFailed();

    error TransferAssetFailed();

    error InsufficientCapacity(uint256 capacity);

    error MessageToL1Failed(uint256 tokenAmount, uint256 ethAmount);
    error EthToL1Failed(uint256 ethAmount);

    error CrossChainAdapterNotSet();

    error OnlyOwnerOrOperator();
    error ResultISharesZero();
    error RatioFeedNotSet();
    error FreeBalanceIsZero();

    error NullParams();

    error ParameterExceedsLimits(uint256 param);

    error NotContract();

    error DepositInconsistentResultedState();

    error OperatorNotRegistered();

    error RestakerNotRegistered();

    error ImplementationNotSet();

    error OnlyOperatorAllowed();

    error AlreadyDelegated();

    error DelegationManagerImmutable();

    error IsNotAbleToRedeem();

    error LowerMinAmount(uint256 minAmount);

    error ZeroFlashWithdrawFee();

    /// TVL errors

    error ExceedsMaxPerDeposit(uint256 max, uint256 amount);

    error ExceedsMaxTotalDeposited(uint256 max, uint256 amount);

    /*///////////////////////////////////////////////////
    / ******************** Events ******************** /
    /////////////////////////////////////////////////*/

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

    event ProtocolFeeChanged(uint256 prevValue, uint256 newValue);

    event TreasuryUpdated(address newTresury);

    event RestakerDeployed(address indexed restaker);

    event ImplementationUpgraded(address prevValue, address newValue);

    event RatioFeedChanged(address prevValue, address newValue);

    event NameChanged(string prevValue, string newValue);

    event ReferralCode(address indexed sender, bytes32 indexed code);

    event DepositBonus(uint256 amount);

    event CrossChainAdapterChanged(
        address prevCrossChainAdapter,
        address newCrossChainAdapter
    );

    event MessageToL1Sent(
        uint256 indexed tokensAmount,
        uint256 indexed ethAmount
    );

    event EthCrossChainSent(uint256 callValue, uint256 indexed chainId);

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

    event AssetsInfoSentToL1(uint256 tokensAmount, uint256 ethAmount);

    event EthSentToL1(uint256 ethAmount);

    event TargetCapacityChanged(uint256 prevValue, uint256 newValue);
}

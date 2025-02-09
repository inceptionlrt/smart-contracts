// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IStrategyManager, IStrategy} from "./eigen-core/IStrategyManager.sol";
import {IInceptionToken} from "../common/IInceptionToken.sol";

interface IInceptionVault_EL {
    /*/////////////////////////////////////////////////////////////////////
    ///////////////////////////// Structures /////////////////////////////
    ///////////////////////////////////////////////////////////////////*/

    enum FuncTarget {
        SETTER_FACET,
        EIGEN_LAYER_FACET,
        ERC4626_FACET
    }

    enum FuncAccess {
        EVERYONE,
        ONLY_OPERATOR,
        ONLY_OWNER
    }

    struct FuncData {
        FuncTarget facet;
        FuncAccess access;
    }

    /**
     * @dev Epoch represents the period of the rebalancing process
     * @dev Receiver is a receiver of assets in claim()
     * @dev Amount represents the exact amount of the asset to be claimed
     */
    struct Withdrawal {
        uint256 epoch;
        address receiver;
        uint256 amount;
    }

    /*/////////////////////////////////////////////////////////////////////
    /////////////////////////////// Events ///////////////////////////////
    ///////////////////////////////////////////////////////////////////*/

    event StartWithdrawal(
        address indexed stakerAddress,
        IStrategy strategy,
        uint256 shares,
        uint32 withdrawalStartBlock,
        address delegatedAddress,
        uint256 nonce
    );

    event DepositedToEL(address indexed stakerAddress, uint256 amount);

    event DelegatedTo(
        address indexed stakerAddress,
        address indexed operatorAddress,
        uint256 amount
    );

    event WithdrawalClaimed(uint256 totalAmount);

    event DelegationManagerChanged(address prevValue, address newValue);

    event TargetCapacityChanged(uint256 prevValue, uint256 newValue);

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

    event WithdrawalFee(uint256 fee);

    event RedeemedRequests(uint256[] withdrawals);

    event OperatorChanged(address prevValue, address newValue);

    event MinAmountChanged(uint256 prevValue, uint256 newValue);

    event ELOperatorAdded(address indexed newELOperator);

    event AdapterDeployed(address indexed adapter);

    event ImplementationUpgraded(address prevValue, address newValue);

    event RatioFeedChanged(address prevValue, address newValue);

    event NameChanged(string prevValue, string newValue);

    event TreasuryChanged(address prevValue, address newValue);

    event ReferralCode(bytes32 indexed code);

    event DepositBonus(uint256 amount);

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

    event RewardsTimelineChanged(uint256 prevValue, uint256 newValue);

    event RewardsAdded(uint256 amount, uint256 startTimeline);

    event EigenLayerFacetChanged(address prevValue, address newValue);

    event SetterFacetChanged(address prevValue, address newValue);

    event ERC4626FacetChanged(address prevValue, address newValue);

    event SignatureAdded(
        bytes4 indexed sig,
        FuncTarget target,
        FuncAccess access
    );

    event RewardsCoordinatorChanged(address prevValue, address newValue);

    event AirDropClaimed(address sender, address receiver, uint256 amount);
}

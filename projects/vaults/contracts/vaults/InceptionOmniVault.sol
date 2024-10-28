// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {InceptionOmniAssetsHandler} from "../assets-handler/InceptionOmniAssetsHandler.sol";

import {IOwnable} from "../interfaces/IOwnable.sol";
import {IInceptionToken} from "../interfaces/IInceptionToken.sol";
import {IInceptionRatioFeed} from "../interfaces/IInceptionRatioFeed.sol";
import {ICrossChainAdapterL2} from "../interfaces/ICrossChainAdapterL2.sol";

import {InternalInceptionLibrary} from "../lib/InternalInceptionLibrary.sol";
import {Convert} from "../lib/Convert.sol";

/// @author The InceptionLRT team
/// @title InceptionOmniVault
/// @dev A vault that handles deposits, withdrawals, and cross-chain operations for the Inception protocol.
/// @notice Allows users to deposit ETH, receive inception tokens, and handle asset transfers between L1 and L2.
contract InceptionOmniVault is InceptionOmniAssetsHandler {
    /// @dev Inception token used for staking and rewards.
    IInceptionToken public inceptionToken;

    /// @dev Minimum amount required for deposits to avoid rounding issues.
    uint256 public minAmount;

    /// @dev Unique name for the vault.
    string public name;

    address public operator;

    IInceptionRatioFeed public ratioFeed;

    ICrossChainAdapterL2 public crossChainAdapter;

    /**
     *  @dev Flash withdrawal params
     */

    uint256 public depositBonusAmount;

    /// @dev measured in percentage, MAX_TARGET_PERCENT - 100%
    uint256 public targetCapacity;

    uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;
    uint64 public constant MAX_PERCENT = 100 * 1e8;

    address public treasury;
    uint64 public protocolFee;

    /// @dev deposit bonus
    uint64 public maxBonusRate;
    uint64 public optimalBonusRate;
    uint64 public depositUtilizationKink;

    /// @dev flash withdrawal fee
    uint64 public maxFlashFeeRate;
    uint64 public optimalWithdrawalRate;
    uint64 public withdrawUtilizationKink;

    /// @dev Modifier to restrict functions to owner or operator.
    modifier onlyOwnerOrOperator() {
        if (msg.sender != owner() && msg.sender != operator) {
            revert OnlyOwnerOrOperator();
        }
        _;
    }

    /**
     * @dev Initializes the vault with required parameters.
     * @param vaultName Name of the vault.
     * @param _operator Address of the operator.
     * @param _inceptionToken Address of the Inception token.
     * @param _crossChainAdapter Address of the cross-chain adapter.
     */
    function __InceptionOmniVault_init(
        string memory vaultName,
        address _operator,
        address _inceptionToken,
        ICrossChainAdapterL2 _crossChainAdapter
    ) public initializer {
        __Ownable_init(msg.sender);
        __InceptionOmniAssetsHandler_init();

        if (_inceptionToken == address(0) || _operator == address(0))
            revert NullParams();

        name = vaultName;

        operator = _operator;
        treasury = msg.sender;

        inceptionToken = IInceptionToken(_inceptionToken);
        crossChainAdapter = _crossChainAdapter;

        minAmount = 1e8;

        targetCapacity = 0.5 * 1e18;

        protocolFee = 50 * 1e8;

        depositUtilizationKink = 25 * 1e8;
        maxBonusRate = 1.5 * 1e8;
        optimalBonusRate = 0.25 * 1e8;

        withdrawUtilizationKink = 25 * 1e8;
        maxFlashFeeRate = 3 * 1e8;
        optimalWithdrawalRate = 0.5 * 1e8;
    }

    /*//////////////////////////////
    ////// Deposit functions ////////
    //////////////////////////////*/

    /**
     * @dev Ensures deposit parameters are valid.
     * @param receiver Address receiving the deposit.
     * @param amount Amount of assets to be deposited.
     */
    function __beforeDeposit(address receiver, uint256 amount) internal view {
        if (receiver == address(0)) revert NullParams();
        if (amount < minAmount) revert LowerMinAmount(minAmount);
    }

    /**
     * @dev Ensures the calculated iShares is valid post-deposit.
     * @param iShares Number of shares issued after the deposit.
     */
    function __afterDeposit(uint256 iShares) internal pure {
        if (iShares == 0) revert DepositInconsistentResultedState();
    }

    /**
     * @notice Deposits ETH and mints corresponding inception tokens.
     * @param receiver Address receiving the inception tokens.
     * @return iShares Number of shares issued in exchange for the deposit.
     */
    function deposit(
        address receiver
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        return _deposit(msg.value, msg.sender, receiver);
    }

    /// @notice The deposit function but with a referral code
    function depositWithReferral(
        address receiver,
        bytes32 code
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        emit ReferralCode(code);
        return _deposit(msg.value, msg.sender, receiver);
    }

    /**
     * @dev Internal function to handle the actual deposit logic.
     * @param amount Amount of ETH deposited.
     * @param sender Address initiating the deposit.
     * @param receiver Address receiving the inception tokens.
     * @return iShares Number of inception tokens minted.
     */
    function _deposit(
        uint256 amount,
        address sender,
        address receiver
    ) internal returns (uint256) {
        uint256 currentRatio = ratio();
        __beforeDeposit(receiver, amount);

        uint256 depositBonus;
        if (depositBonusAmount > 0) {
            uint256 capacity = getFlashCapacity();
            depositBonus = _calculateDepositBonus(amount, capacity - amount);
            if (depositBonus > depositBonusAmount) {
                depositBonus = depositBonusAmount;
                depositBonusAmount = 0;
            } else {
                depositBonusAmount -= depositBonus;
            }
            emit DepositBonus(depositBonus);
        }

        uint256 iShares = Convert.multiplyAndDivideFloor(
            amount + depositBonus,
            currentRatio,
            1e18
        );
        inceptionToken.mint(receiver, iShares);
        __afterDeposit(iShares);

        emit Deposit(sender, receiver, amount, iShares);
        return iShares;
    }

    /*/////////////////////////////////////////////
    ///////// Flash Withdrawal functions /////////
    ///////////////////////////////////////////*/

    /**
     * @dev Ensures withdrawal parameters are valid.
     * @param receiver Address receiving the withdrawal.
     * @param iShares Number of shares to be withdrawn.
     */
    function __beforeWithdraw(address receiver, uint256 iShares) internal pure {
        if (iShares == 0) {
            revert NullParams();
        }
        if (receiver == address(0)) {
            revert NullParams();
        }
    }

    /**
     * @notice Handles flash withdrawals by burning inception tokens and transferring ETH.
     * @param iShares Number of shares to withdraw.
     * @param receiver Address receiving the withdrawn ETH.
     */
    function flashWithdraw(
        uint256 iShares,
        address receiver
    ) external whenNotPaused nonReentrant {
        __beforeWithdraw(receiver, iShares);

        address claimer = msg.sender;
        uint256 currentRatio = ratio();
        uint256 amount = Convert.multiplyAndDivideFloor(
            iShares,
            1e18,
            currentRatio
        );
        uint256 capacity = getFlashCapacity();
        if (amount < minAmount) revert LowerMinAmount(minAmount);
        if (amount > capacity) revert InsufficientCapacity(capacity);

        inceptionToken.burn(claimer, iShares);

        uint256 fee = calculateFlashWithdrawFee(amount);
        amount -= fee;
        uint256 protocolWithdrawalFee = (fee * protocolFee) / MAX_PERCENT;
        depositBonusAmount += (fee - protocolWithdrawalFee);

        _transferAssetTo(treasury, protocolWithdrawalFee);
        _transferAssetTo(receiver, amount);

        emit FlashWithdraw(claimer, receiver, claimer, amount, iShares, fee);
    }

    /*//////////////////////////////
    ////// Cross-chain functions ///
    //////////////////////////////*/

    /**
     * @notice Sends asset information (total token and ETH balances) to Layer 1.
     */
    function sendAssetsInfoToL1() external payable onlyOwnerOrOperator {
        if (address(crossChainAdapter) == address(0))
            revert CrossChainAdapterNotSet();

        uint256 tokensAmount = _inceptionTokenSupply();
        uint256 ethAmount = getTotalDeposited();

        crossChainAdapter.sendDataToL1{value: msg.value}(
            block.timestamp,
            tokensAmount,
            ethAmount
        );

        emit MessageToL1Sent(tokensAmount, ethAmount);
    }

    /**
     * @notice Calculates price to send data message to Layer 1.
     */
    function quoteSendAssetsInfoToL1() external view returns (uint256 fees) {
        require(
            address(crossChainAdapter) != address(0),
            CrossChainAdapterNotSet()
        );
        uint256 tokensAmount = _inceptionTokenSupply();
        uint256 ethAmount = getTotalDeposited();

        fees = crossChainAdapter.quote(
            block.timestamp,
            tokensAmount,
            ethAmount
        );
    }

    /**
     * @notice Sends available ETH to Layer 1 via cross-chain adapter.
     * @dev msg.value is used to pay for the cross-chain fees
     */
    function sendEthToL1() external payable onlyOwnerOrOperator {
        uint256 freeBalance = getFreeBalance();
        if (freeBalance == 0) revert FreeBalanceIsZero();

        crossChainAdapter.sendEthToL1{value: freeBalance + msg.value}();

        emit EthToL1Sent(freeBalance);
    }

    /**
     * @notice Calculates fees to send data message to Layer 1.
     */
    function quoteSendEthToL1(
        uint256 _chaindId,
        bytes memory _options
    ) external view returns (uint256) {
        require(
            address(crossChainAdapter) != address(0),
            CrossChainAdapterNotSet()
        );
        return crossChainAdapter.quoteSendEth(_chaindId, _options);
    }

    /*//////////////////////////////
    ////// Utility functions ///////
    //////////////////////////////*/

    /**
     * @notice Calculates the bonus for a deposit based on the current utilization rate.
     * @param amount Amount of the deposit.
     * @return bonus Calculated bonus.
     */
    function calculateDepositBonus(
        uint256 amount
    ) public view returns (uint256 bonus) {
        return
            InternalInceptionLibrary.calculateDepositBonus(
                amount,
                getFlashCapacity(),
                (_getTargetCapacity() * depositUtilizationKink) / MAX_PERCENT,
                optimalBonusRate,
                maxBonusRate,
                _getTargetCapacity()
            );
    }

    /**
     * @dev Internal function to calculate the deposit bonus.
     * @param amount Amount of the deposit.
     * @param capacity Available capacity for the deposit.
     * @return bonus Calculated bonus.
     */
    function _calculateDepositBonus(
        uint256 amount,
        uint256 capacity
    ) internal view returns (uint256 bonus) {
        uint256 optimalCapacity = (targetCapacity * depositUtilizationKink) /
            MAX_PERCENT;

        if (amount > 0 && capacity < optimalCapacity) {
            uint256 replenished = amount;
            if (optimalCapacity < capacity + amount)
                replenished = optimalCapacity - capacity;

            uint256 x_1 = maxBonusRate - optimalBonusRate;
            uint256 x = x_1 * 1e18;

            uint256 bonusSlope = x /
                ((optimalCapacity * 1e18) / targetCapacity);

            uint256 bonusPercent = maxBonusRate -
                (bonusSlope * (capacity + replenished / 2)) /
                targetCapacity;

            capacity += replenished;
            bonus += (replenished * bonusPercent) / MAX_PERCENT;
            amount -= replenished;
        }
        /// @dev the utilization rate is in the range [25: ] %
        if (amount > 0 && capacity <= targetCapacity) {
            uint256 replenished = targetCapacity > capacity + amount
                ? amount
                : targetCapacity - capacity;
            bonus += (replenished * optimalBonusRate) / MAX_PERCENT;
        }
    }

    /**
     * @notice Calculates the fee for a flash withdrawal based on the current utilization rate.
     * @param amount Amount of the withdrawal.
     * @return fee Calculated fee.
     */
    function calculateFlashWithdrawFee(
        uint256 amount
    ) public view returns (uint256) {
        uint256 capacity = getFlashCapacity();
        if (amount > capacity) revert InsufficientCapacity(capacity);

        return
            InternalInceptionLibrary.calculateWithdrawalFee(
                amount,
                capacity,
                (_getTargetCapacity() * withdrawUtilizationKink) / MAX_PERCENT,
                optimalWithdrawalRate,
                maxFlashFeeRate,
                _getTargetCapacity()
            );
    }

    /*//////////////////////////////
    ////// Factory functions //////
    ////////////////////////////*/

    function ratio() public view returns (uint256) {
        return ratioFeed.getRatioFor(address(inceptionToken));
    }

    function getFlashCapacity() public view returns (uint256 total) {
        return totalAssets() - depositBonusAmount;
    }

    function getFreeBalance() public view returns (uint256 total) {
        return
            getFlashCapacity() < targetCapacity
                ? 0
                : getFlashCapacity() - targetCapacity;
    }

    function getTotalDeposited() public view returns (uint256) {
        return totalAssets() - depositBonusAmount;
    }

    function _inceptionTokenSupply() public view returns (uint256) {
        return IERC20(address(inceptionToken)).totalSupply();
    }

    function _getTargetCapacity() internal view returns (uint256) {
        return (targetCapacity * getTotalDeposited()) / MAX_TARGET_PERCENT;
    }

    /*//////////////////////////////
    ////// Convert functions //////
    ////////////////////////////*/

    function convertToShares(
        uint256 assets
    ) public view returns (uint256 shares) {
        return Convert.multiplyAndDivideFloor(assets, ratio(), 1e18);
    }

    function convertToAssets(
        uint256 iShares
    ) public view returns (uint256 assets) {
        return Convert.multiplyAndDivideFloor(iShares, 1e18, ratio());
    }

    /*//////////////////////////
    ////// SET functions //////
    ////////////////////////*/

    function setDepositBonusParams(
        uint64 newMaxBonusRate,
        uint64 newOptimalBonusRate,
        uint64 newDepositUtilizationKink
    ) external onlyOwner {
        if (newMaxBonusRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newMaxBonusRate);
        if (newOptimalBonusRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newOptimalBonusRate);
        if (newDepositUtilizationKink > MAX_PERCENT)
            revert ParameterExceedsLimits(newDepositUtilizationKink);

        maxBonusRate = newMaxBonusRate;
        optimalBonusRate = newOptimalBonusRate;
        depositUtilizationKink = newDepositUtilizationKink;

        emit DepositBonusParamsChanged(
            newMaxBonusRate,
            newOptimalBonusRate,
            newDepositUtilizationKink
        );
    }

    function setFlashWithdrawFeeParams(
        uint64 newMaxFlashFeeRate,
        uint64 newOptimalWithdrawalRate,
        uint64 newWithdrawUtilizationKink
    ) external onlyOwner {
        if (newMaxFlashFeeRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newMaxFlashFeeRate);
        if (newOptimalWithdrawalRate > MAX_PERCENT)
            revert ParameterExceedsLimits(newOptimalWithdrawalRate);
        if (newWithdrawUtilizationKink > MAX_PERCENT)
            revert ParameterExceedsLimits(newWithdrawUtilizationKink);

        maxFlashFeeRate = newMaxFlashFeeRate;
        optimalWithdrawalRate = newOptimalWithdrawalRate;
        withdrawUtilizationKink = newWithdrawUtilizationKink;

        emit WithdrawFeeParamsChanged(
            newMaxFlashFeeRate,
            newOptimalWithdrawalRate,
            newWithdrawUtilizationKink
        );
    }

    function setProtocolFee(uint64 newProtocolFee) external onlyOwner {
        if (newProtocolFee >= MAX_PERCENT)
            revert ParameterExceedsLimits(newProtocolFee);

        emit ProtocolFeeChanged(protocolFee, newProtocolFee);
        protocolFee = newProtocolFee;
    }

    function setRatioFeed(IInceptionRatioFeed newRatioFeed) external onlyOwner {
        if (address(newRatioFeed) == address(0)) revert NullParams();

        emit RatioFeedChanged(address(ratioFeed), address(newRatioFeed));
        ratioFeed = newRatioFeed;
    }

    function setMinAmount(uint256 newMinAmount) external onlyOwner {
        emit MinAmountChanged(minAmount, newMinAmount);
        minAmount = newMinAmount;
    }

    function setTreasuryAddress(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert NullParams();

        emit TreasuryUpdated(newTreasury);
        treasury = newTreasury;
    }

    function setCrossChainAdapter(
        address payable newCrossChainAdapter
    ) external onlyOwner {
        if (newCrossChainAdapter == address(0)) revert NullParams();
        emit CrossChainAdapterChanged(newCrossChainAdapter);
        crossChainAdapter = ICrossChainAdapterL2(newCrossChainAdapter);
    }

    function setTargetFlashCapacity(
        uint256 newTargetCapacity
    ) external onlyOwner {
        if (newTargetCapacity == 0) revert NullParams();
        emit TargetCapacityChanged(targetCapacity, newTargetCapacity);
        targetCapacity = newTargetCapacity;
    }

    function setName(string memory newVaultName) external onlyOwner {
        if (bytes(newVaultName).length == 0) revert NullParams();

        emit NameChanged(name, newVaultName);
        name = newVaultName;
    }

    function setOperator(address _newOperator) external onlyOwner {
        emit OperatorChanged(operator, _newOperator);
        operator = _newOperator;
    }

    /*///////////////////////////////
    ////// Pausable functions //////
    /////////////////////////////*/

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {InceptionERC20OmniAssetsHandler} from "../assets-handler/InceptionERC20OmniAssetsHandler.sol";

import {IInceptionVault} from "../interfaces/IInceptionVault.sol";
import {IInceptionToken} from "../interfaces/IInceptionToken.sol";
import {IInceptionRatioFeed} from "../interfaces/IInceptionRatioFeed.sol";
import {ICrossChainBridgeERC20L2} from "../interfaces/ICrossChainAdapterERC20L2.sol";

import {InternalInceptionLibrary} from "../lib/InternalInceptionLibrary.sol";
import {Convert} from "../lib/Convert.sol";

/// @author The InceptionLRT team
/// @title InceptionERC20OmniVault
/// @dev A vault that handles deposits, withdrawals, and cross-chain operations for the Inception protocol.
/// @notice Allows users to deposit an asset(e.g. stETH), receive inception tokens, and handle asset transfers between L1 and L2.
contract InceptionERC20OmniVault is InceptionERC20OmniAssetsHandler {
    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    uint256 public minAmount;

    /// @dev the unique InceptionVault name
    string public name;

    address public operator;

    IInceptionRatioFeed public ratioFeed;

    ICrossChainBridgeERC20L2 public crossChainAdapterERC20;

    /**
     *  @dev Flash withdrawal params
     */

    uint256 public depositBonusAmount;

    uint256 public targetCapacity;

    uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;
    uint256 public constant MAX_PERCENT = 100 * 1e8;

    address public treasuryAddress;
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
        if (msg.sender != owner() && msg.sender != operator)
            revert OnlyOwnerOrOperator();

        _;
    }


    function init(
        string memory _vaultName,
        address _operator,
        IInceptionToken _inceptionToken,
        IERC20 _wrappedAsset,
        ICrossChainBridgeERC20L2 _crossChainAdapter
    ) external {
        __InceptionERC20OmniVault_init(
          _vaultName,
         _operator,
         _inceptionToken,
         _wrappedAsset,
         _crossChainAdapter
        );
    }

    function __InceptionERC20OmniVault_init(
        string memory vaultName,
        address _operator,
        IInceptionToken _inceptionToken,
        IERC20 _wrappedAsset,
        ICrossChainBridgeERC20L2 _crossChainAdapter
    ) internal {
        __Ownable_init(msg.sender);
        __InceptionERC20OmniAssetsHandler_init(_wrappedAsset);

        name = vaultName;
        operator = _operator;
        treasuryAddress = msg.sender;
        inceptionToken = _inceptionToken;
        crossChainAdapterERC20 = _crossChainAdapter;


        minAmount = 1e8;

        targetCapacity = 1;
        protocolFee = 50 * 1e8;

        /// @dev deposit bonus
        depositUtilizationKink = 25 * 1e8;
        maxBonusRate = 1.5 * 1e8;
        optimalBonusRate = 0.25 * 1e8;

        /// @dev withdrawal fee
        withdrawUtilizationKink = 25 * 1e8;
        maxFlashFeeRate = 3 * 1e8;
        optimalWithdrawalRate = 0.5 * 1e8;
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

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

    /// @dev Transfers the msg.sender's assets to the vault.
    /// @dev Mints Inception tokens in accordance with the current ratio.
    /// @dev Issues the tokens to the specified receiver address.
    function deposit(
        uint256 amount,
        address receiver
    ) external nonReentrant whenNotPaused returns (uint256) {
        return _deposit(amount, msg.sender, receiver);
    }

    /// @notice The deposit function but with a referral code
    function depositWithReferral(
        uint256 amount,
        address receiver,
        bytes32 code
    ) external nonReentrant whenNotPaused returns (uint256) {
        emit ReferralCode(msg.sender, code);
        return _deposit(amount, msg.sender, receiver);
    }

    function _deposit(
        uint256 amount,
        address sender,
        address receiver
    ) internal returns (uint256) {
        uint256 currentRatio = ratio();
        // transfers assets from the sender and returns the received amount
        // the actual received amount might slightly differ from the specified amount,
        // approximately by -2 wei

        __beforeDeposit(receiver, amount);
        uint256 depositedBefore = totalAssets();
        uint256 depositBonus;
        if (depositBonusAmount > 0) {
            depositBonus = calculateDepositBonus(amount);
            if (depositBonus > depositBonusAmount) {
                depositBonus = depositBonusAmount;
                depositBonusAmount = 0;
            } else {
                depositBonusAmount -= depositBonus;
            }
            emit DepositBonus(depositBonus);
        }

        // pull the amount from the sender
        _transferAssetFrom(sender, amount);
        amount = totalAssets() - depositedBefore;

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

    /*///////////////////////////////////////
    ///////// Withdrawal functions /////////
    /////////////////////////////////////*/

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

    /*/////////////////////////////////////////////
    ///////// Flash Withdrawal functions /////////
    ///////////////////////////////////////////*/

    /// @dev Performs burning iToken from mgs.sender
    /// @dev Creates a withdrawal requests based on the current ratio
    /// @param iShares is measured in Inception token(shares)
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

        // burn Inception token in view of the current ratio
        inceptionToken.burn(claimer, iShares);

        uint256 fee = calculateFlashWithdrawFee(amount);
        if (fee == 0) revert ZeroFlashWithdrawFee();
        amount -= fee;
        uint256 protocolWithdrawalFee = (fee * protocolFee) / MAX_PERCENT;
        depositBonusAmount += (fee - protocolWithdrawalFee);

        /// @notice instant transfer fee to the treasuryAddress
        _transferAssetTo(treasuryAddress, protocolWithdrawalFee);
        /// @notice instant transfer amount to the receiver
        _transferAssetTo(receiver, amount);

        emit FlashWithdraw(claimer, receiver, claimer, amount, iShares, fee);
    }

     /*//////////////////////////////
    ////// Cross-chain functions ///
    //////////////////////////////*/

    /**
     * @notice Sends asset information (total Inception and underlying token balances) to Layer 1.
     */
    function sendAssetsInfoToL1(
        bytes memory _options
    ) external payable onlyOwnerOrOperator {
        require(
            address(crossChainAdapterERC20) != address(0),
            CrossChainAdapterNotSet()
        );

        uint256 msgValue = msg.value; // fees are still paid in ETH

        uint256 tokensAmount = _inceptionTokenSupply();
        uint256 erc20Amount = getFlashCapacity() - msg.value;
        bytes memory payload = abi.encode(
            block.timestamp,
            tokensAmount,
            erc20Amount
        );

        require(
            msgValue >= quoteSendAssetsInfoToL1(_options),
            FeesAboveMsgValue(msgValue)
        );

        uint256 fees = crossChainAdapterERC20.sendDataL1{value: msgValue}(
            payload,
            _options
        );

        uint256 unusedFees = msgValue - fees;

        if (unusedFees > 0) {
            (bool success, ) = msg.sender.call{value: unusedFees}("");
            if (success) {
                emit UnusedFeesSentBackToOperator(unusedFees);
            }
        }

        emit MessageToL1Sent(tokensAmount, erc20Amount);
    }

    /**
     * @notice Calculates price to send data message to Layer 1.
     */
    function quoteSendAssetsInfoToL1(
        bytes memory _options
    ) public view returns (uint256 fees) {
        require(
            address(crossChainAdapterERC20) != address(0),
            CrossChainAdapterNotSet()
        );
        uint256 tokensAmount = _inceptionTokenSupply();
        uint256 erc20Amount = getFlashCapacity();
        bytes memory payload = abi.encode(
            block.timestamp,
            tokensAmount,
            erc20Amount
        );

        fees = crossChainAdapterERC20.quote(payload, _options);
    }


    /**
     * @notice Sends available ERC20 to another chain via cross-chain adapter.
     * @dev msg.value is used to pay for the cross-chain fees
     */
    function sendERC20ToL1(
        uint256 _chainId,
        bytes memory _options
    ) external payable onlyOwnerOrOperator {
        uint256 freeBalance = getFreeBalance();
        // TODO needs to be changed (or removed?) for erc20 handling
        /*
        require(
            freeBalance > msg.value,
            FreeBalanceTooLow(freeBalance, msg.value)
        );
        */
        uint256 msgValue = msg.value;
        require(
            msg.value >= this.quoteSendERC20CrossChain(_chainId, _options),
            FeesAboveMsgValue(msgValue)
        ); // we're still using ETH to pay LayerZero fees

        uint256 fees = crossChainAdapterERC20.sendERC20CrossChain{value: freeBalance}(
            _chainId,
            _options
        );

        uint256 unusedFees = msg.value - fees;

        if (unusedFees > 0) {
            (bool success, ) = msg.sender.call{value: unusedFees}("");
            if (success) {
                emit UnusedFeesSentBackToOperator(unusedFees);
            }
        }

        uint256 callValue = crossChainAdapterERC20.getValueFromOpts(_options);

        emit ERC20CrossChainSent(callValue, _chainId);

    }

    /**
     * @notice Calculates fees to send ERC20 to other chain. The `SEND_VALUE` encoded in options is not included in the return
     * @param _chainId chain ID of the network to simulate sending ERC20 to
     * @param _options encoded params for cross-chain message. Includes `SEND_VALUE` which is substracted from the end result
     */
    function quoteSendERC20CrossChain(
        uint256 _chainId,
        bytes calldata _options
    ) public view returns (uint256) {
        require(
            address(crossChainAdapterERC20) != address(0),
            CrossChainAdapterNotSet()
        );
        return
            crossChainAdapterERC20.quoteSendERC20(_chainId, _options) -
            crossChainAdapterERC20.getValueFromOpts(_options);
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
    ) public view returns (uint256) {
        return
            InternalInceptionLibrary.calculateDepositBonus(
                amount,
                getFlashCapacity(),
                (targetCapacity * depositUtilizationKink) / MAX_PERCENT,
                optimalBonusRate,
                maxBonusRate,
                targetCapacity
            );
    }

    function _inceptionTokenSupply() internal view returns (uint256) {
        return IERC20(address(inceptionToken)).totalSupply();
    }

    /// @dev Function to calculate flash withdrawal fee based on the utilization rate
    function calculateFlashWithdrawFee(
        uint256 amount
    ) public view returns (uint256) {
        uint256 capacity = getFlashCapacity();
        if (amount > capacity) revert InsufficientCapacity(capacity);

        return
            InternalInceptionLibrary.calculateWithdrawalFee(
                amount,
                capacity,
                (targetCapacity * withdrawUtilizationKink) / MAX_PERCENT,
                optimalWithdrawalRate,
                maxFlashFeeRate,
                targetCapacity
            );
    }

    function getFreeBalance() public view returns (uint256) {
        return
            getFlashCapacity() < targetCapacity
                ? 0
                : getFlashCapacity() - targetCapacity;
    }

    /*//////////////////////////////
    ////// Factory functions //////
    ////////////////////////////*/

    function ratio() public view returns (uint256) {
        return ratioFeed.getRatioFor(address(inceptionToken));
    }

    function getTotalDeposited() public view returns (uint256) {
        return totalAssets() - depositBonusAmount;
    }

    function getFlashCapacity() public view returns (uint256 total) {
        return totalAssets() - depositBonusAmount;
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

    function setTreasuryAddress(address _newTreasury) external onlyOwner {
        if (_newTreasury == address(0)) revert NullParams();

        emit TreasuryUpdated(treasuryAddress, _newTreasury);
        treasuryAddress = _newTreasury;
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

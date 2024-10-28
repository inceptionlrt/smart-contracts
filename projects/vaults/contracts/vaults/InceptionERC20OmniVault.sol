// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {InceptionERC20OmniAssetsHandler} from "../assets-handler/InceptionERC20OmniAssetsHandler.sol";

import {IInceptionVault} from "../interfaces/IInceptionVault.sol";
import {IInceptionToken} from "../interfaces/IInceptionToken.sol";
import {IInceptionRatioFeed} from "../interfaces/IInceptionRatioFeed.sol";
import {ICrossChainAdapterL2} from "../interfaces/ICrossChainAdapterL2.sol";

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

    ICrossChainAdapterL2 public crossChainAdapter;

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

    function __InceptionERC20OmniVault_init(
        string memory vaultName,
        IInceptionToken _inceptionToken,
        IERC20 wrappedAsset
    ) internal {
        __Ownable_init(msg.sender);
        __InceptionERC20OmniAssetsHandler_init(wrappedAsset);

        name = vaultName;
        inceptionToken = _inceptionToken;
        /// TODO
        treasuryAddress = msg.sender;
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

    function __beforeDeposit(address receiver, uint256 amount) internal view {
        if (receiver == address(0)) revert NullParams();
        if (amount < minAmount) revert LowerMinAmount(minAmount);
    }

    function __afterDeposit(uint256 iShares) internal pure {
        if (iShares == 0) revert DepositInconsistentResultedState();
    }

    /// @dev Transfers the msg.sender's assets to the vault.
    /// @dev Mints Inception tokens in accordance with the current ratio.
    /// @dev Issues the tokens to the specified receiver address.
    function deposit(
        uint256 amount,
        address receiver
    ) public nonReentrant whenNotPaused returns (uint256) {
        return _deposit(amount, msg.sender, receiver);
    }

    /// @notice The deposit function but with a referral code
    function depositWithReferral(
        uint256 amount,
        address receiver,
        bytes32 code
    ) external nonReentrant whenNotPaused returns (uint256) {
        emit ReferralCode(code);
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

        // get the amount from the sender
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
        amount -= fee;
        uint256 protocolWithdrawalFee = (fee * protocolFee) / MAX_PERCENT;
        depositBonusAmount += (fee - protocolWithdrawalFee);

        /// @notice instant transfer fee to the treasuryAddress
        _transferAssetTo(treasuryAddress, protocolWithdrawalFee);
        /// @notice instant transfer amount to the receiver
        _transferAssetTo(receiver, amount);

        emit FlashWithdraw(claimer, receiver, claimer, amount, iShares, fee);
    }

    /// @notice Function to calculate deposit bonus based on the utilization rate
    function calculateDepositBonus(
        uint256 amount
    ) public view returns (uint256) {
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

    function setTreasuryAddress(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert NullParams();

        emit TreasuryUpdated(newTreasury);
        treasuryAddress = newTreasury;
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

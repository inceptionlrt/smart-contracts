// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../interfaces/common/IWithdrawalQueue.sol";

import {AdapterHandler, IERC20} from "../../adapter-handler/AdapterHandler.sol";
import {Convert} from "../../lib/Convert.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IInceptionRatioFeed} from "../../interfaces/common/IInceptionRatioFeed.sol";
import {IInceptionToken} from "../../interfaces/common/IInceptionToken.sol";
import {IInceptionVault_S} from "../../interfaces/symbiotic-vault/IInceptionVault_S.sol";
import {InceptionLibrary} from "../../lib/InceptionLibrary.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @author The InceptionLRT team
 * @title The InceptionVault_S contract
 * @notice Aims to maximize the profit of deposited asset.
 */
contract InceptionVault_S is AdapterHandler, IInceptionVault_S {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    /// @custom:oz-renamed-from minAmount
    uint256 public withdrawMinAmount;

    mapping(address => __deprecated_Withdrawal) private __deprecated_claimerWithdrawals;

    /// @dev the unique InceptionVault name
    string public name;

    /// @dev 100%
    uint64 public constant MAX_PERCENT = 100 * 1e8;

    IInceptionRatioFeed public ratioFeed;
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

    /// @dev flash and deposit minAmounts
    uint256 public flashMinAmount;
    uint256 public depositMinAmount;

    mapping(address => uint256) private __deprecated_withdrawals;

    function __InceptionVault_init(
        string memory vaultName,
        address operatorAddress,
        IERC20 assetAddress,
        IInceptionToken _inceptionToken
    ) internal {
        __Ownable2Step_init();
        __AdapterHandler_init(assetAddress);

        name = vaultName;
        _operator = operatorAddress;
        inceptionToken = _inceptionToken;

        withdrawMinAmount = 1e16;
        depositMinAmount = 1e16;
        flashMinAmount = 1e16;

        protocolFee = 50 * 1e8;

        /// @dev deposit bonus
        depositUtilizationKink = 25 * 1e8;
        maxBonusRate = 15 * 1e7;
        optimalBonusRate = 25 * 1e6;

        /// @dev withdrawal fee
        withdrawUtilizationKink = 25 * 1e8;
        maxFlashFeeRate = 30 * 1e7;
        optimalWithdrawalRate = 5 * 1e7;

        treasury = msg.sender;
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    function __beforeDeposit(address receiver, uint256 amount) internal view {
        if (receiver == address(0)) revert NullParams();
        if (amount < depositMinAmount) revert LowerMinAmount(depositMinAmount);
        if (targetCapacity == 0) revert NullParams();
    }

    function __afterDeposit(uint256 iShares) internal pure {
        if (iShares == 0) revert DepositInconsistentResultedState();
    }

    /// @dev Transfers the msg.sender's assets to the vault.
    /// @dev Mints Inception tokens in accordance with the current ratio.
    /// @dev Issues the tokens to the specified receiver address.
    /** @dev See {IERC4626-deposit}. */
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
        emit ReferralCode(code);
        return _deposit(amount, msg.sender, receiver);
    }

    function _deposit(
        uint256 amount,
        address sender,
        address receiver
    ) internal returns (uint256) {
        // transfers assets from the sender and returns the received amount
        // the actual received amount might slightly differ from the specified amount,
        // approximately by -2 wei
        __beforeDeposit(receiver, amount);
        uint256 depositBonus;
        uint256 availableBonusAmount = depositBonusAmount;
        if (availableBonusAmount > 0) {
            depositBonus = calculateDepositBonus(amount);
            if (depositBonus > availableBonusAmount) {
                depositBonus = availableBonusAmount;
                depositBonusAmount = 0;
            } else {
                depositBonusAmount -= depositBonus;
            }
            emit DepositBonus(depositBonus);
        }
        // get the amount from the sender
        _transferAssetFrom(sender, amount);
        uint256 iShares = convertToShares(amount + depositBonus);
        inceptionToken.mint(receiver, iShares);
        __afterDeposit(iShares);
        emit Deposit(sender, receiver, amount, iShares);
        return iShares;
    }

    /** @dev See {IERC4626-mint}. */
    function mint(
        uint256 shares,
        address receiver
    ) external nonReentrant whenNotPaused returns (uint256) {
        uint256 maxShares = maxMint(receiver);
        if (shares > maxShares)
            revert ExceededMaxMint(receiver, shares, maxShares);

        uint256 assetsAmount = previewMint(shares);
        if (_deposit(assetsAmount, msg.sender, receiver) < shares) revert MintedLess();

        return assetsAmount;
    }

    /*///////////////////////////////////////
    ///////// Withdrawal functions /////////
    /////////////////////////////////////*/

    function __beforeWithdraw(address receiver, uint256 iShares) internal view {
        if (iShares == 0) revert NullParams();
        if (receiver == address(0)) revert InvalidAddress();
        if (targetCapacity == 0) revert NullParams();
    }

    /// @dev Performs burning iToken from mgs.sender
    /// @dev Creates a withdrawal requests based on the current ratio
    /// @param iShares is measured in Inception token(shares)
    function withdraw(
        uint256 iShares,
        address receiver
    ) external whenNotPaused nonReentrant {
        __beforeWithdraw(receiver, iShares);
        address claimer = msg.sender;
        uint256 amount = convertToAssets(iShares);
        if (amount < withdrawMinAmount)
            revert LowerMinAmount(withdrawMinAmount);

        // burn Inception token in view of the current ratio
        inceptionToken.burn(claimer, iShares);
        // add withdrawal request
        withdrawalQueue.request(receiver, iShares);

        emit Withdraw(claimer, receiver, claimer, amount, iShares);
    }

    /** @dev See {IERC4626-redeem}. */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) external nonReentrant whenNotPaused returns (uint256) {
        if (owner != msg.sender) revert MsgSenderIsNotOwner();
        __beforeWithdraw(receiver, shares);
        (uint256 assets, uint256 fee) = _flashWithdraw(shares, receiver, owner, 0);

        emit Withdraw(owner, receiver, owner, assets, shares);
        emit WithdrawalFee(fee);

        return assets;
    }

    function redeem(address receiver) external whenNotPaused nonReentrant returns (uint256 assets) {
        // redeem available withdrawals
        assets = withdrawalQueue.redeem(receiver);
        if (assets > 0) {
            // transfer to receiver
            _transferAssetTo(receiver, assets);
            emit Redeem(msg.sender, receiver, assets);
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
        address receiver,
        uint256 minOut
    ) external whenNotPaused nonReentrant {
        __beforeWithdraw(receiver, iShares);
        address claimer = msg.sender;
        (uint256 amount, uint256 fee) = _flashWithdraw(
            iShares,
            receiver,
            claimer,
            minOut
        );
        emit FlashWithdraw(claimer, receiver, claimer, amount, iShares, fee);
    }

    function _flashWithdraw(
        uint256 iShares,
        address receiver,
        address owner,
        uint256 minOut
    ) private returns (uint256, uint256) {
        uint256 amount = convertToAssets(iShares);

        if (amount < flashMinAmount) revert LowerMinAmount(flashMinAmount);

        // burn Inception token in view of the current ratio
        inceptionToken.burn(owner, iShares);

        uint256 fee = calculateFlashWithdrawFee(amount);
        uint256 protocolWithdrawalFee = (fee * protocolFee) / MAX_PERCENT;

        amount -= fee;
        depositBonusAmount += (fee - protocolWithdrawalFee);

        /// @notice instant transfer fee to the treasury
        if (protocolWithdrawalFee != 0)
            _transferAssetTo(treasury, protocolWithdrawalFee);
        if (minOut != 0 && amount < minOut) revert LowerThanMinOut(amount);
        /// @notice instant transfer amount to the receiver
        _transferAssetTo(receiver, amount);

        return (amount, fee);
    }

    /// @notice Function to calculate deposit bonus based on the utilization rate
    function calculateDepositBonus(
        uint256 amount
    ) public view returns (uint256) {
        uint256 targetCapacity = _getTargetCapacity();
        return
            InceptionLibrary.calculateDepositBonus(
            amount,
            getFlashCapacity(),
            (targetCapacity * depositUtilizationKink) / MAX_PERCENT,
            optimalBonusRate,
            maxBonusRate,
            targetCapacity
        );
    }

    /// @dev Function to calculate flash withdrawal fee based on the utilization rate
    function calculateFlashWithdrawFee(
        uint256 amount
    ) public view returns (uint256) {
        uint256 capacity = getFlashCapacity();
        if (amount > capacity) revert InsufficientCapacity(capacity);
        uint256 targetCapacity = _getTargetCapacity();
        return
            InceptionLibrary.calculateWithdrawalFee(
            amount,
            capacity,
            (targetCapacity * withdrawUtilizationKink) / MAX_PERCENT,
            optimalWithdrawalRate,
            maxFlashFeeRate,
            targetCapacity
        );
    }

    /*//////////////////////////////
    ////// Factory functions //////
    ////////////////////////////*/

    function isAbleToRedeem(
        address claimer
    ) public view returns (bool, uint256[] memory) {
        return withdrawalQueue.isRedeemable(claimer);
    }

    function ratio() public view returns (uint256) {
        return ratioFeed.getRatioFor(address(inceptionToken));
    }

    function getPendingWithdrawalOf(
        address claimer
    ) external view returns (uint256) {
        return withdrawalQueue.getPendingWithdrawalOf(claimer);
    }

    /** @dev See {IERC20Metadata-decimals}. */
    function decimals() public view returns (uint8) {
        return IERC20Metadata(address(inceptionToken)).decimals();
    }

    /** @dev See {IERC4626-maxDeposit}. */
    function maxDeposit(address receiver) public view returns (uint256) {
        return !paused() ? _asset.balanceOf(receiver) : 0;
    }

    /** @dev See {IERC4626-maxMint}. */
    function maxMint(address receiver) public view returns (uint256) {
        if (paused()) {
            return 0;
        }

        return type(uint256).max;
    }

    /** @dev See {IERC4626-maxRedeem}. */
    function maxRedeem(address owner) public view returns (uint256) {
        if (paused()) {
            return 0;
        } else {
            uint256 ownerShares = IERC20(address(inceptionToken)).balanceOf(
                owner
            );
            uint256 flashShares = convertToShares(getFlashCapacity());
            return flashShares > ownerShares ? ownerShares : flashShares;
        }
    }

    /** @dev See {IERC4626-previewDeposit}. */
    function previewDeposit(uint256 assets) public view returns (uint256) {
        if (assets < depositMinAmount) revert LowerMinAmount(depositMinAmount);
        uint256 depositBonus;
        if (depositBonusAmount > 0) {
            depositBonus = calculateDepositBonus(assets);
            if (depositBonus > depositBonusAmount)
                depositBonus = depositBonusAmount;
        }

        return convertToShares(assets + depositBonus);
    }

    /** @dev See {IERC4626-previewMint}. */
    function previewMint(uint256 shares) public view returns (uint256) {

        uint256 assets = Convert.multiplyAndDivideCeil(shares, 1e18, ratio());
        if (assets < depositMinAmount) revert LowerMinAmount(depositMinAmount);
        return assets;
    }

    /** @dev See {IERC4626-previewRedeem}. */
    function previewRedeem(
        uint256 shares
    ) public view returns (uint256 assets) {
        uint256 amount = convertToAssets(shares);
        uint256 capacity = getFlashCapacity();
        uint256 targetCapacity = _getTargetCapacity();
        uint256 flash = amount <= capacity ? capacity : amount;

        return amount - InceptionLibrary.calculateWithdrawalFee(
            amount,
            flash,
            (targetCapacity * withdrawUtilizationKink) / MAX_PERCENT,
            optimalWithdrawalRate,
            maxFlashFeeRate,
            targetCapacity
        );
    }

    /*//////////////////////////////
    ////// Convert functions //////
    ////////////////////////////*/

    /** @dev See {IERC4626-convertToShares}. */
    function convertToShares(
        uint256 assets
    ) public view returns (uint256 shares) {
        return Convert.multiplyAndDivideFloor(assets, ratio(), 1e18);
    }

    /** @dev See {IERC4626-convertToAssets}. */
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
        if (newOptimalBonusRate > newMaxBonusRate) revert InconsistentData();

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
        if (newOptimalWithdrawalRate > newMaxFlashFeeRate)
            revert InconsistentData();

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

    function setTreasuryAddress(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert NullParams();

        emit TreasuryChanged(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setRatioFeed(IInceptionRatioFeed newRatioFeed) external onlyOwner {
        if (address(newRatioFeed) == address(0)) revert NullParams();

        emit RatioFeedChanged(address(ratioFeed), address(newRatioFeed));
        ratioFeed = newRatioFeed;
    }

    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert NullParams();

        emit OperatorChanged(_operator, newOperator);
        _operator = newOperator;
    }

    function setWithdrawMinAmount(uint256 newMinAmount) external onlyOwner {
        if (newMinAmount == 0) revert NullParams();
        emit WithdrawMinAmountChanged(withdrawMinAmount, newMinAmount);
        withdrawMinAmount = newMinAmount;
    }

    function setDepositMinAmount(uint256 newMinAmount) external onlyOwner {
        if (newMinAmount == 0) revert NullParams();
        emit DepositMinAmountChanged(depositMinAmount, newMinAmount);
        depositMinAmount = newMinAmount;
    }

    function setFlashMinAmount(uint256 newMinAmount) external onlyOwner {
        if (newMinAmount == 0) revert NullParams();
        emit FlashMinAmountChanged(flashMinAmount, newMinAmount);
        flashMinAmount = newMinAmount;
    }

    function setName(string memory newVaultName) external onlyOwner {
        if (bytes(newVaultName).length == 0) revert NullParams();

        emit NameChanged(name, newVaultName);
        name = newVaultName;
    }

    function setWithdrawalQueue(IWithdrawalQueue _withdrawalQueue) external onlyOwner {
        withdrawalQueue = _withdrawalQueue;
        emit WithdrawalQueueChanged(address(withdrawalQueue));
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

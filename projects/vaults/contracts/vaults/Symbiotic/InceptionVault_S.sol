// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AdapterHandler, IERC20} from "../../adapter-handler/AdapterHandler.sol";
import {Convert} from "../../lib/Convert.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IInceptionRatioFeed} from "../../interfaces/common/IInceptionRatioFeed.sol";
import {IInceptionToken} from "../../interfaces/common/IInceptionToken.sol";
import {IInceptionVault_S} from "../../interfaces/symbiotic-vault/IInceptionVault_S.sol";
import {InceptionLibrary} from "../../lib/InceptionLibrary.sol";
import {IWithdrawalQueue} from "../../interfaces/common/IWithdrawalQueue.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title InceptionVault_S
 * @author The InceptionLRT team
 * @notice Aims to maximize the profit of deposited asset
 * @dev Handles deposits, withdrawals, and flash withdrawals with bonus and fee mechanisms
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

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    /**
     * @dev Initializes the vault with basic parameters
     * @param vaultName Name of the vault
     * @param operatorAddress Address of the operator
     * @param assetAddress Address of the asset token
     * @param _inceptionToken Address of the Inception token
     */
    function initialize(
        string memory vaultName,
        address operatorAddress,
        IERC20 assetAddress,
        IInceptionToken _inceptionToken
    ) public initializer {
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

    /**
     * @dev Internal function to validate deposit parameters
     * @param receiver Address of the receiver
     * @param amount Amount to deposit
     */
    function __beforeDeposit(address receiver, uint256 amount) internal view {
        if (receiver == address(0)) revert NullParams();
        if (amount < depositMinAmount) revert LowerMinAmount(depositMinAmount);
        if (targetCapacity == 0) revert NullParams();
    }

    /**
     * @dev Internal function to validate deposit result
     * @param iShares Amount of shares minted
     */
    function __afterDeposit(uint256 iShares) internal pure {
        if (iShares == 0) revert DepositInconsistentResultedState();
    }

    /**
     * @dev Deposits assets into the vault and mints Inception tokens. See {IERC4626-deposit}
     * @notice It is recommended to use the deposit function with the `minOut` parameter to protect against slippage.
     * @param amount Amount of assets to deposit
     * @param receiver Address to receive the minted tokens
     * @return Amount of shares minted
     */
    function deposit(
        uint256 amount,
        address receiver
    ) external nonReentrant whenNotPaused returns (uint256) {
        return _deposit(amount, msg.sender, receiver, 0);
    }

    /**
     * @dev Deposits assets into the vault with minimum output check. See {IERC4626-deposit}
     * @param amount Amount of assets to deposit
     * @param receiver Address to receive the minted tokens
     * @param minOut Minimum amount of shares to receive
     * @return Amount of shares minted
     */
    function deposit(
        uint256 amount,
        address receiver,
        uint256 minOut
    ) external nonReentrant whenNotPaused returns (uint256) {
        return _deposit(amount, msg.sender, receiver, minOut);
    }

    /**
     * @dev Deposits assets with a referral code
     * @param amount Amount of assets to deposit
     * @param receiver Address to receive the minted tokens
     * @param code Referral code
     * @return Amount of shares minted
     */
    function depositWithReferral(
        uint256 amount,
        address receiver,
        bytes32 code
    ) external nonReentrant whenNotPaused returns (uint256) {
        emit ReferralCode(code);
        return _deposit(amount, msg.sender, receiver, 0);
    }

    /**
     * @dev Deposits assets with a referral code and minimum output check
     * @param amount Amount of assets to deposit
     * @param receiver Address to receive the minted tokens
     * @param code Referral code
     * @param minOut Minimum amount of shares to receive
     * @return Amount of shares minted
     */
    function depositWithReferral(
        uint256 amount,
        address receiver,
        bytes32 code,
        uint256 minOut
    ) external nonReentrant whenNotPaused returns (uint256) {
        emit ReferralCode(code);
        return _deposit(amount, msg.sender, receiver, minOut);
    }

    /**
     * @dev Internal function to handle deposits
     * @param amount Amount of assets to deposit
     * @param sender Address of the sender
     * @param receiver Address to receive the minted tokens
     * @param minOut Minimum amount of shares to receive
     * @return Amount of shares minted
     */
    function _deposit(
        uint256 amount,
        address sender,
        address receiver,
        uint256 minOut
    ) internal returns (uint256) {
        // transfers assets from the sender and returns the received amount
        // the actual received amount might slightly differ from the specified amount,
        // approximately by -2 wei
        __beforeDeposit(receiver, amount);

        // calculate deposit bonus
        uint256 depositBonus;
        if (depositBonusAmount > 0) {
            depositBonus = calculateDepositBonus(amount);
            if (depositBonus > depositBonusAmount) {
                depositBonus = depositBonusAmount;
            }

            emit DepositBonus(depositBonus);
        }

        // calculate share to mint
        uint256 iShares = convertToShares(amount + depositBonus);
        if (minOut > 0 && iShares < minOut) revert SlippageMinOut(minOut, iShares);

        // update deposit bonus state
        depositBonusAmount -= depositBonus;

        // get the amount from the sender
        _asset.safeTransferFrom(sender, address(this), amount);

        // mint new shares
        inceptionToken.mint(receiver, iShares);

        __afterDeposit(iShares);
        emit Deposit(sender, receiver, amount, iShares);

        return iShares;
    }

    /**
     * @dev Mints shares for assets. See {IERC4626-mint}.
     * @param shares Amount of shares to mint
     * @param receiver Address to receive the minted shares
     * @return Amount of assets deposited
     */
    function mint(
        uint256 shares,
        address receiver
    ) external nonReentrant whenNotPaused returns (uint256) {
        uint256 maxShares = maxMint(receiver);
        if (shares > maxShares)
            revert ExceededMaxMint(receiver, shares, maxShares);

        uint256 assetsAmount = previewMint(shares);
        if (_deposit(assetsAmount, msg.sender, receiver, 0) < shares) revert MintedLess();

        return assetsAmount;
    }

    /*///////////////////////////////////////
    ///////// Withdrawal functions /////////
    /////////////////////////////////////*/

    /**
     * @dev Internal function to validate withdrawal parameters
     * @param receiver Address of the receiver
     * @param iShares Amount of shares to withdraw
     */
    function __beforeWithdraw(address receiver, uint256 iShares) internal view {
        if (iShares == 0) revert NullParams();
        if (receiver == address(0)) revert InvalidAddress();
        if (targetCapacity == 0) revert NullParams();
    }

    /**
     * @dev Performs burning iToken from mgs.sender. Creates a withdrawal requests based on the current ratio
     * @param iShares Amount of shares to burn
     * @param receiver Address to receive the withdrawn assets
     */
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

    /**
     * @dev Redeems shares for assets. See {IERC4626-redeem}.
     * @param shares Amount of shares to redeem
     * @param receiver Address to receive the assets
     * @param owner Address of the share owner
     * @return Amount of assets withdrawn
     */
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

    /**
     * @dev Redeems available withdrawals
     * @param receiver Address to receive the assets
     * @return assets Amount of assets withdrawn
     */
    function redeem(address receiver) external whenNotPaused nonReentrant returns (uint256 assets) {
        // redeem available withdrawals
        assets = withdrawalQueue.redeem(receiver);
        if (assets > 0) {
            // transfer to receiver
            _asset.safeTransfer(receiver, assets);
            emit Redeem(msg.sender, receiver, assets);
        }
    }

    /**
     * @dev Redeems available withdrawals for a specific epoch
     * @param receiver Address to receive the assets
     * @param userEpochIndex Index of the epoch
     * @return assets Amount of assets withdrawn
     */
    function redeem(address receiver, uint256 userEpochIndex) external whenNotPaused nonReentrant returns (uint256 assets) {
        // redeem available withdrawals
        assets = withdrawalQueue.redeem(receiver, userEpochIndex);
        if (assets > 0) {
            // transfer to receiver
            _asset.safeTransfer(receiver, assets);
            emit Redeem(msg.sender, receiver, assets);
        }
    }

    /*/////////////////////////////////////////////
    ///////// Flash Withdrawal functions /////////
    ///////////////////////////////////////////*/

    /**
     * @dev Performs a flash withdrawal with minimum output check
     * @param iShares Amount of shares to burn
     * @param receiver Address to receive the assets
     * @param minOut Minimum amount of assets to receive
     */
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

    /**
     * @dev Performs a flash withdrawal
     * @param iShares Amount of shares to burn
     * @param receiver Address to receive the assets
     */
    function flashWithdraw(
        uint256 iShares,
        address receiver
    ) external whenNotPaused nonReentrant {
        __beforeWithdraw(receiver, iShares);
        address claimer = msg.sender;
        (uint256 amount, uint256 fee) = _flashWithdraw(
            iShares,
            receiver,
            claimer,
            0
        );
        emit FlashWithdraw(claimer, receiver, claimer, amount, iShares, fee);
    }

    /**
     * @dev Internal function to handle flash withdrawals
     * @param iShares Amount of shares to burn
     * @param receiver Address to receive the assets
     * @param owner Address of the share owner
     * @param minOut Minimum amount of assets to receive
     * @return Amount of assets withdrawn and fee charged
     */
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
            _asset.safeTransfer(treasury, protocolWithdrawalFee);
        if (minOut != 0 && amount < minOut) revert SlippageMinOut(minOut, amount);
        /// @notice instant transfer amount to the receiver
        _asset.safeTransfer(receiver, amount);

        return (amount, fee);
    }

    /**
     * @dev Calculates deposit bonus based on utilization rate
     * @param amount Amount of assets to deposit
     * @return Amount of bonus to be applied
     */
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

    /**
     * @dev Calculates flash withdrawal fee based on utilization rate
     * @param amount Amount of assets to withdraw
     * @return Amount of fee to be charged
     */
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

    /**
     * @dev Migrates deposit bonus to a new vault
     * @param newVault Address of the new vault
     */
    function migrateDepositBonus(address newVault) external onlyOwner {
        require(getTotalDelegated() == 0, ValueZero());
        require(newVault != address(0), InvalidAddress());
        require(depositBonusAmount > 0, NullParams());

        uint256 amount = depositBonusAmount;
        depositBonusAmount = 0;

        _asset.safeTransfer(newVault, amount);

        emit DepositBonusTransferred(newVault, amount);
    }

    /*//////////////////////////////
    ////// Factory functions //////
    ////////////////////////////*/

    function isAbleToRedeem(
        address claimer
    ) public view returns (bool, uint256[] memory) {
        return withdrawalQueue.isRedeemable(claimer);
    }

    /**
     * @dev Gets the current ratio for the Inception token
     * @return Current ratio value
     */
    function ratio() public view returns (uint256) {
        uint256 totalSupply = IERC20(address(inceptionToken)).totalSupply();

        uint256 numeral = totalSupply + totalSharesToWithdraw();
        uint256 denominator = getTotalDeposited();

        if (denominator == 0 || numeral == 0) {
            return 1e18;
        }

        return (numeral * 1e18) / denominator;
    }

    /**
     * @dev Gets the pending withdrawal amount for a claimer
     * @param claimer Address of the claimer
     * @return Amount of pending withdrawals
     */
    function getPendingWithdrawalOf(
        address claimer
    ) external view returns (uint256) {
        return withdrawalQueue.getPendingWithdrawalOf(claimer);
    }

    /**
     * @dev Gets the decimals of the Inception token. See {IERC4626-maxDeposit}
     * @return Number of decimals
     */
    function decimals() public view returns (uint8) {
        return IERC20Metadata(address(inceptionToken)).decimals();
    }

    /**
     * @dev Gets the maximum amount that can be deposited. See {IERC4626-maxDeposit}
     * @param receiver Address of the receiver
     * @return Maximum deposit amount
     */
    function maxDeposit(address receiver) public view returns (uint256) {
        return !paused() ? type(uint256).max : 0;
    }

    /**
     * @dev Gets the maximum amount of shares that can be minted. See {IERC4626-maxMint}.
     * @param receiver Address of the receiver
     * @return Maximum mint amount
     */
    function maxMint(address receiver) public view returns (uint256) {
        return !paused() ? type(uint256).max : 0;
    }

    /**
     * @dev Gets the maximum amount of shares that can be redeemed. See {IERC4626-maxRedeem}.
     * @param owner Address of the share owner
     * @return Maximum redeem amount
     */
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

    /**
     * @dev Previews the amount of shares to be received for a deposit. See {IERC4626-previewDeposit}.
     * @param assets Amount of assets to deposit
     * @return Amount of shares to be received
     */
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

    /**
     * @dev Previews the amount of assets needed to mint shares. See {IERC4626-previewMint}.
     * @param shares Amount of shares to mint
     * @return Amount of assets needed
     */
    function previewMint(uint256 shares) public view returns (uint256) {
        uint256 assets = Convert.multiplyAndDivideCeil(shares, 1e18, ratio());
        if (assets < depositMinAmount) revert LowerMinAmount(depositMinAmount);
        return assets;
    }

    /**
     * @dev Previews the amount of assets to be received for redeeming shares. {IERC4626-previewRedeem}.
     * @param shares Amount of shares to redeem
     * @return assets Amount of assets to be received
     */
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

    /**
     * @dev Converts assets to shares. See {IERC4626-convertToShares}.
     * @param assets Amount of assets
     * @return shares Amount of shares
     */
    function convertToShares(
        uint256 assets
    ) public view returns (uint256 shares) {
        return Convert.multiplyAndDivideFloor(assets, ratio(), 1e18);
    }

    /**
     * @dev Converts shares to assets. See {IERC4626-convertToAssets}.
     * @param iShares Amount of shares
     * @return assets Amount of assets
     */
    function convertToAssets(
        uint256 iShares
    ) public view returns (uint256 assets) {
        return Convert.multiplyAndDivideFloor(iShares, 1e18, ratio());
    }

    /*//////////////////////////
    ////// SET functions //////
    ////////////////////////*/

    /**
     * @dev Sets deposit bonus parameters
     * @param newMaxBonusRate New maximum bonus rate
     * @param newOptimalBonusRate New optimal bonus rate
     * @param newDepositUtilizationKink New deposit utilization kink
     * @notice Be careful: settings are not validated to conform to the expected curve.
     */
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

    /**
     * @dev Sets flash withdrawal fee parameters
     * @param newMaxFlashFeeRate New maximum flash fee rate
     * @param newOptimalWithdrawalRate New optimal withdrawal rate
     * @param newWithdrawUtilizationKink New withdrawal utilization kink
     * @notice Be careful: settings are not validated to conform to the expected curve.
     */
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

    /**
     * @dev Sets the protocol fee
     * @param newProtocolFee New protocol fee value
     */
    function setProtocolFee(uint64 newProtocolFee) external onlyOwner {
        if (newProtocolFee >= MAX_PERCENT)
            revert ParameterExceedsLimits(newProtocolFee);

        emit ProtocolFeeChanged(protocolFee, newProtocolFee);
        protocolFee = newProtocolFee;
    }

    /**
     * @dev Sets the treasury address
     * @param newTreasury New treasury address
     */
    function setTreasuryAddress(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert NullParams();

        emit TreasuryChanged(treasury, newTreasury);
        treasury = newTreasury;
    }

    /**
     * @dev Sets the ratio feed
     * @param newRatioFeed New ratio feed address
     */
    function setRatioFeed(IInceptionRatioFeed newRatioFeed) external onlyOwner {
        if (address(newRatioFeed) == address(0)) revert NullParams();

        emit RatioFeedChanged(address(ratioFeed), address(newRatioFeed));
        ratioFeed = newRatioFeed;
    }

    /**
     * @dev Sets the operator address
     * @param newOperator New operator address
     */
    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert NullParams();

        emit OperatorChanged(_operator, newOperator);
        _operator = newOperator;
    }

    /**
     * @dev Sets the minimum withdrawal amount
     * @param newMinAmount New minimum withdrawal amount
     */
    function setWithdrawMinAmount(uint256 newMinAmount) external onlyOwner {
        if (newMinAmount == 0) revert NullParams();
        emit WithdrawMinAmountChanged(withdrawMinAmount, newMinAmount);
        withdrawMinAmount = newMinAmount;
    }

    /**
     * @dev Sets the minimum deposit amount
     * @param newMinAmount New minimum deposit amount
     */
    function setDepositMinAmount(uint256 newMinAmount) external onlyOwner {
        if (newMinAmount == 0) revert NullParams();
        emit DepositMinAmountChanged(depositMinAmount, newMinAmount);
        depositMinAmount = newMinAmount;
    }

    /**
     * @dev Sets the minimum flash withdrawal amount
     * @param newMinAmount New minimum flash withdrawal amount
     */
    function setFlashMinAmount(uint256 newMinAmount) external onlyOwner {
        if (newMinAmount == 0) revert NullParams();
        emit FlashMinAmountChanged(flashMinAmount, newMinAmount);
        flashMinAmount = newMinAmount;
    }

    /**
     * @dev Sets the vault name
     * @param newVaultName New vault name
     */
    function setName(string memory newVaultName) external onlyOwner {
        if (bytes(newVaultName).length == 0) revert NullParams();

        emit NameChanged(name, newVaultName);
        name = newVaultName;
    }

    /**
     * @dev Sets the withdrawal queue
     * @param _withdrawalQueue New withdrawal queue address
     * @notice Ensure the protocol was paused during deployment of the new withdrawal queue
     *         if the previous one contained legacy withdrawals..
     */
    function setWithdrawalQueue(IWithdrawalQueue _withdrawalQueue) external onlyOwner {
        withdrawalQueue = _withdrawalQueue;
        emit WithdrawalQueueChanged(address(withdrawalQueue));
    }

    /*///////////////////////////////
    ////// Pausable functions //////
    /////////////////////////////*/

    /**
     * @dev Pauses the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

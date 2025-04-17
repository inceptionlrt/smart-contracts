// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {AdapterHandler, IERC20} from "../../adapter-handler/AdapterHandler.sol";
import {IInceptionVault_S} from "../../interfaces/symbiotic-vault/IInceptionVault_S.sol";
import {IInceptionToken} from "../../interfaces/common/IInceptionToken.sol";
import {IInceptionRatioFeed} from "../../interfaces/common/IInceptionRatioFeed.sol";
import {InceptionLibrary} from "../../lib/InceptionLibrary.sol";
import {Convert} from "../../lib/Convert.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @author The InceptionLRT team
 * @title The InceptionVault_S contract
 * @notice Aims to maximize the profit of deposited asset.
 * @dev Handles deposits and withdrawal requests within the Inception protocol.
 */
contract InceptionVault_S is AdapterHandler, IInceptionVault_S {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    /// @custom:oz-renamed-from minAmount
    uint256 public withdrawMinAmount;

    mapping(address => Withdrawal) private _claimerWithdrawals;

    /// @dev the unique InceptionVault name
    string public name;

    /**
     *  @dev Flash withdrawal params
     */

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

    mapping(address => uint256) public withdrawals;
    mapping(address => uint256) public recentEpoch;

    uint256 public MAX_GAP_BETWEEN_EPOCH;

    /**
     * @dev Initializes the vault with basic parameters
     * @param vaultName Name of the vault
     * @param operatorAddress Address of the operator
     * @param assetAddress Address of the underlying asset
     * @param _inceptionToken Address of the Inception token
     * 
     * Sets initial values for:
     * - Minimum amounts for operations
     * - Protocol fee
     * - Deposit bonus parameters
     * - Withdrawal fee parameters
     * - Treasury address
     * - Maximum epoch gap
     */
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

        MAX_GAP_BETWEEN_EPOCH = 20;
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    /**
     * @dev Validates deposit parameters before processing
     * @param receiver Address receiving the deposit
     * @param amount Amount to be deposited
     * 
     * Requirements:
     * - Receiver address must not be zero
     * - Amount must be greater than minimum deposit amount
     * - Target capacity must not be zero
     */
    function __beforeDeposit(address receiver, uint256 amount) internal view {
        if (receiver == address(0)) revert NullParams();
        if (amount < depositMinAmount) revert LowerMinAmount(depositMinAmount);

        if (targetCapacity == 0) revert InceptionOnPause();
    }

    /**
     * @dev Validates deposit result
     * @param iShares Amount of shares minted
     * 
     * Requirements:
     * - Shares minted must be greater than zero
     */
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

    /**
     * @dev Internal deposit function handling the core deposit logic
     * @param amount Amount to deposit
     * @param sender Address sending the assets
     * @param receiver Address receiving the shares
     * @return iShares Amount of shares minted
     * 
     * Process:
     * 1. Validates deposit parameters
     * 2. Calculates and applies deposit bonus if available
     * 3. Transfers assets from sender
     * 4. Mints shares to receiver
     * 5. Emits deposit event
     */
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

    /**
     * @dev Validates withdrawal parameters before processing
     * @param receiver Address receiving the withdrawal
     * @param iShares Amount of shares to withdraw
     * 
     * Requirements:
     * - Shares amount must not be zero
     * - Receiver address must not be zero
     * - Target capacity must not be zero
     */
    function __beforeWithdraw(address receiver, uint256 iShares) internal view {
        if (iShares == 0) revert ValueZero();
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

        // update global state and claimer's state
        totalAmountToWithdraw += amount;
        Withdrawal storage genRequest = _claimerWithdrawals[receiver];
        genRequest.amount += _getAssetReceivedAmount(amount);

        if (recentEpoch[receiver] - genRequest.epoch > MAX_GAP_BETWEEN_EPOCH) revert MaxGapReached();

        uint256 queueLength = claimerWithdrawalsQueue.length;
        if (withdrawals[receiver] == 0) genRequest.epoch = queueLength;
        withdrawals[receiver]++;
        recentEpoch[receiver] = queueLength;
        claimerWithdrawalsQueue.push(
            Withdrawal({
                epoch: queueLength,
                receiver: receiver,
                amount: _getAssetReceivedAmount(amount)
            })
        );

        emit Withdraw(claimer, receiver, claimer, amount, iShares);
    }

    /** @dev See {IERC4626-redeem}. */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) external nonReentrant whenNotPaused returns (uint256 assets) {
        if (owner != msg.sender) revert MsgSenderIsNotOwner();
        __beforeWithdraw(receiver, shares);
        uint256 fee;
        (assets, fee) = _flashWithdraw(shares, receiver, owner, 0);

        emit Withdraw(owner, receiver, owner, assets, shares);
        emit WithdrawalFee(fee);

        return assets;
    }

    /**
     * @dev Processes withdrawal requests for a claimer
     * @param receiver Address to redeem withdrawals for
     * 
     * Process:
     * 1. Checks if withdrawals are available
     * 2. Processes each available withdrawal
     * 3. Updates withdrawal state
     * 4. Transfers assets to receiver
     * 5. Emits redemption events
     */
    function redeem(address receiver) external whenNotPaused nonReentrant {
        (bool isAble, uint256[] memory availableWithdrawals) = isAbleToRedeem(
            receiver
        );
        if (!isAble) revert IsNotAbleToRedeem();

        uint256 numOfWithdrawals = availableWithdrawals.length;

        Withdrawal storage genRequest = _claimerWithdrawals[receiver];
        uint256 redeemedAmount;
        uint256 withdrawalsBuffer;
        for (uint256 i = 0; i < numOfWithdrawals; ++i) {
            uint256 withdrawalNum = availableWithdrawals[i];
            Withdrawal storage request = claimerWithdrawalsQueue[withdrawalNum];
            uint256 amount = request.amount;
            // update the genRequest and the global state
            genRequest.amount -= amount;

            totalAmountToWithdraw -= _getAssetWithdrawAmount(amount);
            redeemReservedAmount -= amount;
            redeemedAmount += amount;
            withdrawalsBuffer++;

            delete claimerWithdrawalsQueue[availableWithdrawals[i]];
        }

        withdrawals[receiver] -= withdrawalsBuffer;

        // let's update the lowest epoch associated with the claimer
        genRequest.epoch = availableWithdrawals[numOfWithdrawals - 1];

        _transferAssetTo(receiver, redeemedAmount);

        emit RedeemedRequests(availableWithdrawals);
        emit Redeem(msg.sender, receiver, redeemedAmount);
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
    ) external whenNotPaused nonReentrant returns (uint256) {
        __beforeWithdraw(receiver, iShares);
        address claimer = msg.sender;
        (uint256 amount, uint256 fee) = _flashWithdraw(
            iShares,
            receiver,
            claimer,
            minOut
        );
        emit FlashWithdraw(claimer, receiver, claimer, amount, iShares, fee);
        return amount;
    }

    /**
     * @dev Internal function handling flash withdrawal logic
     * @param iShares Amount of shares to withdraw
     * @param receiver Address receiving the assets
     * @param owner Address owning the shares
     * @param minOut Minimum amount of assets to receive
     * @return amount Amount of assets withdrawn
     * @return fee Fee charged for the withdrawal
     * 
     * Process:
     * 1. Converts shares to assets
     * 2. Calculates and applies withdrawal fee
     * 3. Distributes protocol fee to treasury
     * 4. Transfers remaining assets to receiver
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

    /**
     * @dev Checks if a claimer can redeem their withdrawals
     * @param claimer Address to check
     * @return able Whether withdrawals can be redeemed
     * @return availableWithdrawals Array of withdrawal indices that can be redeemed
     */
    function isAbleToRedeem(
        address claimer
    ) public view returns (bool able, uint256[] memory) {
        // get the general request
        uint256 index;
        uint256 rEpoch = recentEpoch[claimer];

        uint256[] memory availableWithdrawals;
        Withdrawal memory genRequest = _claimerWithdrawals[claimer];
        if (claimer == address(0)) return (false, availableWithdrawals);
        if (genRequest.amount == 0) return (false, availableWithdrawals);
        if (rEpoch < genRequest.epoch) return (false, availableWithdrawals);

        availableWithdrawals = new uint256[](withdrawals[claimer]);

        rEpoch = rEpoch >= epoch ? epoch : ++rEpoch;

        for (uint256 i = genRequest.epoch; i < rEpoch; ++i) {
            if (claimerWithdrawalsQueue[i].receiver == claimer) {
                able = true;
                availableWithdrawals[index] = i;
                ++index;
            }
        }
        // decrease arrays
        if (availableWithdrawals.length - index > 0)
            assembly {
                mstore(availableWithdrawals, index)
            }

        return (able, availableWithdrawals);
    }

    function ratio() public view returns (uint256) {
        return ratioFeed.getRatioFor(address(inceptionToken));
    }

    function getPendingWithdrawalOf(
        address claimer
    ) external view returns (uint256) {
        return _claimerWithdrawals[claimer].amount;
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
        if (shares == 0) revert NullParams();
        
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

    /**
     * @dev Sets deposit bonus parameters
     * @param newMaxBonusRate Maximum bonus rate
     * @param newOptimalBonusRate Optimal bonus rate
     * @param newDepositUtilizationKink Utilization kink point
     * 
     * Requirements:
     * - All parameters must be less than MAX_PERCENT
     * - Optimal bonus rate must be less than maximum bonus rate
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
     * @param newMaxFlashFeeRate Maximum fee rate
     * @param newOptimalWithdrawalRate Optimal withdrawal rate
     * @param newWithdrawUtilizationKink Utilization kink point
     * 
     * Requirements:
     * - All parameters must be less than MAX_PERCENT
     * - Optimal withdrawal rate must be less than maximum fee rate
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
     * 
     * Requirements:
     * - New fee must be less than MAX_PERCENT
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
     * 
     * Requirements:
     * - New address must not be zero
     */
    function setTreasuryAddress(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert NullParams();

        emit TreasuryChanged(treasury, newTreasury);
        treasury = newTreasury;
    }

    /**
     * @dev Sets the ratio feed contract
     * @param newRatioFeed New ratio feed address
     * 
     * Requirements:
     * - New address must not be zero
     */
    function setRatioFeed(IInceptionRatioFeed newRatioFeed) external onlyOwner {
        if (address(newRatioFeed) == address(0)) revert NullParams();

        emit RatioFeedChanged(address(ratioFeed), address(newRatioFeed));
        ratioFeed = newRatioFeed;
    }

    /**
     * @dev Sets the operator address
     * @param newOperator New operator address
     * 
     * Requirements:
     * - New address must not be zero
     */
    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert NullParams();

        emit OperatorChanged(_operator, newOperator);
        _operator = newOperator;
    }

    /**
     * @dev Sets the minimum withdrawal amount
     * @param newMinAmount New minimum amount
     * 
     * Requirements:
     * - New amount must not be zero
     */
    function setWithdrawMinAmount(uint256 newMinAmount) external onlyOwner {
        if (newMinAmount == 0) revert NullParams();
        emit WithdrawMinAmountChanged(withdrawMinAmount, newMinAmount);
        withdrawMinAmount = newMinAmount;
    }

    /**
     * @dev Sets the minimum deposit amount
     * @param newMinAmount New minimum amount
     * 
     * Requirements:
     * - New amount must not be zero
     */
    function setDepositMinAmount(uint256 newMinAmount) external onlyOwner {
        if (newMinAmount == 0) revert NullParams();
        emit DepositMinAmountChanged(depositMinAmount, newMinAmount);
        depositMinAmount = newMinAmount;
    }

    /**
     * @dev Sets the minimum flash withdrawal amount
     * @param newMinAmount New minimum amount
     * 
     * Requirements:
     * - New amount must not be zero
     */
    function setFlashMinAmount(uint256 newMinAmount) external onlyOwner {
        if (newMinAmount == 0) revert NullParams();
        emit FlashMinAmountChanged(flashMinAmount, newMinAmount);
        flashMinAmount = newMinAmount;
    }

    /**
     * @dev Sets the maximum gap between epochs
     * @param newGap New maximum gap value
     * 
     * Requirements:
     * - New gap must not be zero
     */
    function setMaxGap(uint256 newGap) external onlyOwner {
        if (newGap == 0) revert NullParams();
        emit MaxGapSet(MAX_GAP_BETWEEN_EPOCH, newGap);
        MAX_GAP_BETWEEN_EPOCH = newGap;
    }

    /**
     * @dev Sets the vault name
     * @param newVaultName New vault name
     * 
     * Requirements:
     * - New name must not be empty
     */
    function setName(string memory newVaultName) external onlyOwner {
        if (bytes(newVaultName).length == 0) revert NullParams();

        emit NameChanged(name, newVaultName);
        name = newVaultName;
    }

    /// @dev Temporary function. Meant for upgrade only since we introduced 'withdrawals'
    function adjustWithdrawals() external onlyOwner {

        uint256 queueLength = claimerWithdrawalsQueue.length;

        // Duplicate queue
        address[] memory queue = new address[](queueLength);

        // Copy Address to new Array
        for (uint256 i = 0; i < queueLength; i++) {
            queue[i] = claimerWithdrawalsQueue[i].receiver;
        }

        // Traverse through the addresses
        for (uint256 i = 0; i < queueLength; i++) {

            // Means fulfilled
            if (queue[i] == address(0)) continue;

            bool skipElement;
            for (uint256 j = 0; j < i; j++) {

                if (queue[j] == queue[i]) {
                    skipElement = true;
                    break;
                }
            }

            if (skipElement) continue;

            uint256 numWithdrawal;
            for (uint256 k = i; k < queue.length; k++) {

                if (queue[i] == queue[k]) numWithdrawal++;
            }

            withdrawals[queue[i]] = numWithdrawal;
        }
    }

    /*///////////////////////////////
    ////// Pausable functions //////
    /////////////////////////////*/

    /**
     * @dev Pauses the contract
     * 
     * Requirements:
     * - Can only be called by the owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract
     * 
     * Requirements:
     * - Can only be called by the owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

import "../assets-handler/InceptionAssetsHandler.sol";

import "../interfaces/IOwnable.sol";
import "../interfaces/IInceptionVault.sol";
import "../interfaces/IInceptionToken.sol";
import "../interfaces/IInceptionRatioFeed.sol";
import "../interfaces/ICrossChainAdapterL2.sol";

/// @author The InceptionLRT team
/// @title The InceptionOmniVault contract
contract InceptionOmniVault is IInceptionVault, InceptionAssetsHandler {
    event TargetCapacityChanged(
        uint256 targetCapacity,
        uint256 newTargetCapacity
    );

    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    uint256 public minAmount;

    /// @dev the unique InceptionVault name
    string public name;

    /**
     *  @dev Flash withdrawal params
     */
    address public treasuryAddress;
    IInceptionRatioFeed public ratioFeed;

    ICrossChainAdapterL2 public crossChainAdapter;

    uint256 public depositBonusAmount;
    uint256 public targetCapacity;

    uint256 public constant MAX_PERCENT = 100 * 1e8;

    uint256 public protocolFee;

    uint256 public maxBonusRate;
    uint256 public optimalBonusRate;
    uint256 public depositUtilizationKink;

    uint256 public maxFlashFeeRate;
    uint256 public optimalWithdrawalRate;
    uint256 public withdrawUtilizationKink;

    function __InceptionOmniVault_init(
        string memory vaultName,
        address _inceptionToken,
        ICrossChainAdapterL2 _crossChainAdapter
    ) public initializer {
        __Ownable_init();
        if (_inceptionToken == address(0)) {
            revert NullParams();
        }
        __InceptionAssetsHandler_init(IERC20(_inceptionToken));

        name = vaultName;
        inceptionToken = IInceptionToken(_inceptionToken);
        crossChainAdapter = _crossChainAdapter;
        /// TODO
        treasuryAddress = msg.sender;
        minAmount = 100;

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
        require(iShares > 0, "InceptionVault: result iShares 0");
    }

    /// @dev Transfers the msg.sender's assets to the vault.
    /// @dev Mints Inception tokens in accordance with the current ratio.
    /// @dev Issues the tokens to the specified receiver address.
    function deposit(
        address receiver
    ) public payable nonReentrant whenNotPaused returns (uint256) {
        return _deposit(msg.value, msg.sender, receiver);
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
        uint256 depositBonus;
        if (depositBonusAmount > 0) {
            console.log("here 3");
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

        uint256 fee = calculateFlashUnstakeFee(amount);
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
    ) public view returns (uint256 bonus) {
        uint256 capacity = getFlashCapacity();
        return _calculateDepositBonus(amount, capacity);
    }

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

            uint256 bonusSlope = ((maxBonusRate - optimalBonusRate) * 1e18) /
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

    /// @dev Function to calculate flash withdrawal fee based on the utilization rate
    function calculateFlashUnstakeFee(
        uint256 amount
    ) public view returns (uint256 fee) {
        uint256 capacity = getFlashCapacity();
        if (amount > capacity) revert InsufficientCapacity(capacity);

        uint256 optimalCapacity = (targetCapacity * withdrawUtilizationKink) /
            MAX_PERCENT;

        /// @dev the utilization rate is greater 1, [ :100] %
        if (amount > 0 && capacity > targetCapacity) {
            uint256 replenished = amount;
            if (capacity - amount < targetCapacity)
                replenished = capacity - targetCapacity;

            amount -= replenished;
            capacity -= replenished;
        }
        /// @dev the utilization rate is in the range [100:25] %
        if (amount > 0 && capacity > optimalCapacity) {
            uint256 replenished = amount;
            if (capacity - amount < optimalCapacity)
                replenished = capacity - optimalCapacity;

            fee += (replenished * optimalWithdrawalRate) / MAX_PERCENT; // 0.5%
            amount -= replenished;
            capacity -= replenished;
        }
        /// @dev the utilization rate is in the range [25:0] %
        if (amount > 0) {
            uint256 feeSlope = ((maxFlashFeeRate - optimalWithdrawalRate) *
                1e18) / ((optimalCapacity * 1e18) / targetCapacity);
            uint256 bonusPercent = maxFlashFeeRate -
                (feeSlope * (capacity - amount / 2)) /
                targetCapacity;
            fee += (amount * bonusPercent) / MAX_PERCENT;
        }
    }

    /**
     * @dev Sends the information about the total amount of tokens and ETH held by this contract to L1 using CrossChainAdapter.
     * @notice This only sends the info, not the actual assets.
     */
    function sendAssetsInfoToL1() external onlyOwner {
        if (address(crossChainAdapter) == address(0)) {
            revert CrossChainAdapterNotSet();
        }
        uint256 tokensAmount = getTotalTokens();
        uint256 ethAmount = getTotalEth();

        // Send the assets information (not the actual assets) to L1
        bool success = crossChainAdapter.sendAssetsInfoToL1(
            tokensAmount,
            ethAmount
        );

        if (!success) {
            revert MessageToL1Failed(tokensAmount, ethAmount);
        }

        emit AssetsInfoSentToL1(tokensAmount, ethAmount);
    }

    /**
     * @dev Sends a specific amount of ETH to L1 using CrossChainAdapter.
     * @notice This actually sends ETH, unlike sendAssetsInfoToL1 which only sends information.
     * @param amount The amount of ETH to send to L1.
     */
    function sendEthToL1(uint256 amount) external onlyOwner {
        require(amount <= getTotalEth(), "Not enough ETH");

        // Send ETH to L1 using the CrossChainAdapter
        bool success = crossChainAdapter.sendEthToL1{value: amount}();

        if (!success) {
            revert EthToL1Failed(amount);
        }

        emit EthSentToL1(amount);
    }

    function getTotalTokens() public view returns (uint256) {
        return IERC20(address(inceptionToken)).balanceOf(address(this));
    }

    function getTotalEth() public view returns (uint256) {
        return address(this).balance;
    }

    /*//////////////////////////////
    ////// Factory functions //////
    ////////////////////////////*/

    function ratio() public view returns (uint256) {
        require(address(ratioFeed) != address(0), "RatioFeed is set to zero");
        return ratioFeed.getRatioFor(address(inceptionToken));
    }

    function getFlashCapacity() public view returns (uint256 total) {
        return totalAssets() - depositBonusAmount;
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

    function setCrossChainAdapter(
        address newCrossChainAdapter
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

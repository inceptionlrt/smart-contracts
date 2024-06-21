// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BeaconProxy, Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import {IOwnable} from "../../interfaces/IOwnable.sol";
import {IInceptionVault} from "../../interfaces/IInceptionVault.sol";
import {IInceptionToken} from "../../interfaces/IInceptionToken.sol";
import {IRebalanceStrategy} from "../../interfaces/IRebalanceStrategy.sol";
import {IDelegationManager} from "../../interfaces/IDelegationManager.sol";
import {IInceptionRatioFeed} from "../../interfaces/IInceptionRatioFeed.sol";
import "../eigenlayer-handler/EigenLayerHandler.sol";

import {InceptionLibrary} from "../lib/InceptionLibrary.sol";

/// @author The InceptionLRT team
/// @title The InceptionVault contract
/// @notice Aims to maximize the profit of EigenLayer for a certain asset.
contract InceptionVault is IInceptionVault, EigenLayerHandler {
    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    uint256 public minAmount;

    mapping(address => Withdrawal) private _claimerWithdrawals;

    /// @dev the unique InceptionVault name
    string public name;

    /// @dev Factory variables
    address private _stakerImplementation;

    /**
     *  @dev Flash withdrawal params
     */

    /// @dev 100%
    uint256 public constant MAX_PERCENT = 100 * 1e4;

    address public treasury;
    IInceptionRatioFeed public ratioFeed;

    uint64 public utilizationKink;
    uint64 public protocolFee;

    uint64 public maxBonusRate;
    uint64 public optimalBonusPercent;
    uint64 public optimalBonusRate;
    uint64 public depositBonusSlope;

    uint64 public maxFlashFeeRate;
    uint64 public optimalWithdrawalRate;
    uint64 public flashWithdrawalSlope;

    function __InceptionVault_init(
        string memory vaultName,
        address operatorAddress,
        IStrategyManager _strategyManager,
        IInceptionToken _inceptionToken,
        IStrategy _assetStrategy
    ) internal {
        __Ownable_init();
        __EigenLayerHandler_init(_strategyManager, _assetStrategy);

        name = vaultName;
        _operator = operatorAddress;
        inceptionToken = _inceptionToken;

        minAmount = 100;

        /// @notice TODO

        utilizationKink = 25 * 1e4;

        /// @dev deposit bonus
        maxBonusRate = 15 * 1e3;
        optimalBonusRate = 25 * 1e2;
        depositBonusSlope = 5 * 1e4;

        /// @dev withdrawal fee
        maxFlashFeeRate = 30 * 1e3;
        optimalWithdrawalRate = 5 * 1e3;
        flashWithdrawalSlope = 1e5;

        protocolFee = 50 * 1e4;

        treasury = msg.sender;
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    function __beforeDeposit(address receiver, uint256 amount) internal view {
        if (receiver == address(0)) revert NullParams();
        if (amount < minAmount) revert LowerMinAmount(minAmount);
        if (!_verifyDelegated()) revert InceptionOnPause();
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
    ) public nonReentrant whenNotPaused returns (uint256) {
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

    /*/////////////////////////////////
    ////// Delegation functions //////
    ///////////////////////////////*/

    function delegateToOperator(
        uint256 amount,
        address elOperator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) external nonReentrant whenNotPaused onlyOperator {
        if (elOperator == address(0)) revert NullParams();

        _beforeDepositAssetIntoStrategy(amount);

        // try to find a restaker for the specific EL operator
        address restaker = _operatorRestakers[elOperator];
        if (restaker == address(0)) revert OperatorNotRegistered();

        bool delegate = false;
        if (restaker == _MOCK_ADDRESS) {
            delegate = true;
            // deploy a new restaker
            restaker = _deployNewStub();
            _operatorRestakers[elOperator] = restaker;
            restakers.push(restaker);
        }

        _depositAssetIntoStrategy(restaker, amount);

        if (delegate)
            _delegateToOperator(
                restaker,
                elOperator,
                approverSalt,
                approverSignatureAndExpiry
            );

        emit DelegatedTo(restaker, elOperator);
    }

    /*///////////////////////////////////////
    ///////// Withdrawal functions /////////
    /////////////////////////////////////*/

    function __beforeWithdraw(address receiver, uint256 iShares) internal view {
        if (iShares == 0) revert NullParams();
        if (receiver == address(0)) revert NullParams();

        if (!_verifyDelegated()) revert InceptionOnPause();
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
        uint256 amount = Convert.multiplyAndDivideFloor(iShares, 1e18, ratio());
        if (amount < minAmount) revert LowerMinAmount(minAmount);

        // burn Inception token in view of the current ratio
        inceptionToken.burn(claimer, iShares);

        // update global state and claimer's state
        totalAmountToWithdraw += amount;
        Withdrawal storage genRequest = _claimerWithdrawals[receiver];
        genRequest.amount += _getAssetReceivedAmount(amount);
        claimerWithdrawalsQueue.push(
            Withdrawal({
                epoch: claimerWithdrawalsQueue.length,
                receiver: receiver,
                amount: _getAssetReceivedAmount(amount)
            })
        );

        emit Withdraw(claimer, receiver, claimer, amount, iShares);
    }

    function redeem(address receiver) public whenNotPaused nonReentrant {
        (bool isAble, uint256[] memory availableWithdrawals) = isAbleToRedeem(
            receiver
        );
        if (!isAble) revert IsNotAbleToRedeem();

        uint256 numOfWithdrawals = availableWithdrawals.length;
        uint256[] memory redeemedWithdrawals = new uint256[](numOfWithdrawals);

        Withdrawal storage genRequest = _claimerWithdrawals[receiver];
        uint256 redeemedAmount;
        for (uint256 i = 0; i < numOfWithdrawals; ++i) {
            uint256 withdrawalNum = availableWithdrawals[i];
            Withdrawal storage request = claimerWithdrawalsQueue[withdrawalNum];
            uint256 amount = request.amount;
            // update the genRequest and the global state
            genRequest.amount -= amount;

            totalAmountToWithdraw -= _getAssetWithdrawAmount(amount);
            redeemReservedAmount -= amount;
            redeemedAmount += amount;
            redeemedWithdrawals[i] = withdrawalNum;

            delete claimerWithdrawalsQueue[availableWithdrawals[i]];
        }

        // let's update the lowest epoch associated with the claimer
        genRequest.epoch = availableWithdrawals[numOfWithdrawals - 1];

        _transferAssetTo(receiver, redeemedAmount);

        emit RedeemedRequests(redeemedWithdrawals);
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
        address receiver
    ) external whenNotPaused nonReentrant {
        __beforeWithdraw(receiver, iShares);

        address claimer = msg.sender;
        uint256 amount = convertToAssets(iShares);

        if (amount < minAmount) revert LowerMinAmount(minAmount);
        /// TODO
        if (amount > getFlashCapacity()) revert InsufficientCapacity(0);

        // burn Inception token in view of the current ratio
        inceptionToken.burn(claimer, iShares);

        uint256 fee = calculateFlashUnstakeFee(amount);
        /// TODO
        amount -= fee;
        uint256 protocolWithdrawalFee = (fee * 1) / MAX_PERCENT;
        depositBonusAmount += (fee - protocolWithdrawalFee);

        /// @notice instant transfer fee to the treasury
        _transferAssetTo(treasury, protocolWithdrawalFee);
        /// @notice instant transfer amount to the receiver
        _transferAssetTo(receiver, amount);

        emit FlashWithdraw(claimer, receiver, claimer, amount, iShares, fee);
    }

    /// @notice Function to calculate deposit bonus based on the utilization rate
    function calculateDepositBonus(
        uint256 amount
    ) public view returns (uint256) {
        return
            InceptionLibrary.calculateDepositBonus(
                amount,
                getFlashCapacity(),
                (targetCapacity * utilizationKink) / MAX_PERCENT,
                optimalBonusRate,
                maxBonusRate,
                depositBonusSlope,
                targetCapacity
            );
    }

    /// @dev Function to calculate flash withdrawal fee based on the utilization rate
    function calculateFlashUnstakeFee(
        uint256 amount
    ) public view returns (uint256) {
        uint256 capacity = getFlashCapacity();
        if (amount > capacity) revert InsufficientCapacity(capacity);

        return
            InceptionLibrary.calculateWithdrawalFee(
                amount,
                capacity,
                (targetCapacity * utilizationKink) / MAX_PERCENT,
                optimalWithdrawalRate,
                maxFlashFeeRate,
                flashWithdrawalSlope,
                targetCapacity
            );
    }

    /*//////////////////////////////
    ////// Factory functions //////
    ////////////////////////////*/

    function _deployNewStub() internal returns (address) {
        if (_stakerImplementation == address(0)) {
            revert ImplementationNotSet();
        }
        // deploy new beacon proxy and do init call
        bytes memory data = abi.encodeWithSignature(
            "initialize(address,address,address,address)",
            delegationManager,
            strategyManager,
            strategy,
            _operator
        );
        address deployedAddress = address(new BeaconProxy(address(this), data));

        IOwnable asOwnable = IOwnable(deployedAddress);
        asOwnable.transferOwnership(owner());

        emit RestakerDeployed(deployedAddress);
        return deployedAddress;
    }

    function implementation() external view returns (address) {
        return _stakerImplementation;
    }

    function upgradeTo(
        address newImplementation
    ) external whenNotPaused onlyOwner {
        if (!Address.isContract(newImplementation)) revert NotContract();

        emit ImplementationUpgraded(_stakerImplementation, newImplementation);
        _stakerImplementation = newImplementation;
    }

    function isAbleToRedeem(
        address claimer
    ) public view returns (bool able, uint256[] memory) {
        // get the general request
        uint256 index;
        Withdrawal memory genRequest = _claimerWithdrawals[claimer];
        uint256[] memory availableWithdrawals = new uint256[](
            epoch - genRequest.epoch
        );
        if (genRequest.amount == 0) return (false, availableWithdrawals);

        for (uint256 i = 0; i < epoch; ++i) {
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
        //  if (IERC20(address(inceptionToken)).totalSupply() == 0) return 1e18;

        // uint256 r =
        // if (r == 0) return 1e18;
        return ratioFeed.getRatioFor(address(inceptionToken));
    }

    /// @dev returns the total deposited into asset strategy
    function getTotalDeposited() public view returns (uint256) {
        return
            getTotalDelegated() +
            totalAssets() +
            _pendingWithdrawalAmount -
            depositBonusAmount;
    }

    function getTotalDelegated() public view returns (uint256 total) {
        uint256 stakersNum = restakers.length;
        for (uint256 i = 0; i < stakersNum; ++i) {
            if (restakers[i] == address(0)) continue;
            total += strategy.userUnderlyingView(restakers[i]);
        }
        return total + strategy.userUnderlyingView(address(this));
    }

    function getDelegatedTo(address elOperator) public view returns (uint256) {
        return strategy.userUnderlyingView(_operatorRestakers[elOperator]);
    }

    function getPendingWithdrawalOf(
        address claimer
    ) public view returns (uint256) {
        return _claimerWithdrawals[claimer].amount;
    }

    function _verifyDelegated() internal view returns (bool) {
        for (uint256 i = 0; i < restakers.length; i++) {
            if (restakers[i] == address(0)) {
                continue;
            }
            if (!delegationManager.isDelegated(restakers[i])) return false;
        }

        if (
            strategy.userUnderlyingView(address(this)) > 0 &&
            !delegationManager.isDelegated(address(this))
        ) return false;

        return true;
    }

    function maxDeposit(address /*receiver*/) public view returns (uint256) {
        (uint256 maxPerDeposit, ) = strategy.getTVLLimits();
        return maxPerDeposit;
    }

    function maxRedeem(
        address account
    ) public view returns (uint256 maxShares) {
        return
            convertToAssets(IERC20(address(inceptionToken)).balanceOf(account));
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
        uint32 newMaxBonusRate,
        uint32 newOptimalBonusRate,
        uint32 newDepositBonusSlope
    ) external onlyOwner {
        if (newMaxBonusRate >= MAX_PERCENT)
            revert ParameterExceedsLimits(newMaxBonusRate);
        if (newOptimalBonusRate >= MAX_PERCENT)
            revert ParameterExceedsLimits(newMaxBonusRate);
        if (newDepositBonusSlope >= MAX_PERCENT)
            revert ParameterExceedsLimits(newMaxBonusRate);

        // maxBonusRate = newMaxBonusRate;
        // optimalBonusRate = newOptimalBonusRate;
        // depositBonusSlope = newDepositBonusSlope;

        emit DepositBonusParamsChanged(
            newMaxBonusRate,
            newOptimalBonusRate,
            newDepositBonusSlope
        );
    }

    function setFlashWithdrawFeeParams(
        uint32 newMaxFlashFeeRate,
        uint32 newOptimalWithdrawalRate,
        uint32 newFlashWithdrawalSlope
    ) external onlyOwner {
        /// @dev withdrawal fee
        // maxFlashFeeRate = newMaxFlashFeeRate;
        // optimalWithdrawalRate = newOptimalWithdrawalRate;
        // flashWithdrawalSlope = newFlashWithdrawalSlope;

        emit WithdrawFeeParamsChanged(
            newMaxFlashFeeRate,
            newOptimalWithdrawalRate,
            newFlashWithdrawalSlope
        );
    }

    function setUtilizationKink(uint32 newUtilizationKink) external onlyOwner {
        emit UtilizationKinkChanged(utilizationKink, newUtilizationKink);
        utilizationKink = newUtilizationKink;
    }

    function setProtocolFee(uint32 newProtocolFee) external onlyOwner {
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

    function setMinAmount(uint256 newMinAmount) external onlyOwner {
        emit MinAmountChanged(minAmount, newMinAmount);
        minAmount = newMinAmount;
    }

    function setName(string memory newVaultName) external onlyOwner {
        if (bytes(newVaultName).length == 0) revert NullParams();

        emit NameChanged(name, newVaultName);
        name = newVaultName;
    }

    function addELOperator(address newELOperator) external onlyOwner {
        if (!delegationManager.isOperator(newELOperator))
            revert NotEigenLayerOperator();

        if (_operatorRestakers[newELOperator] != address(0))
            revert EigenLayerOperatorAlreadyExists();

        _operatorRestakers[newELOperator] = _MOCK_ADDRESS;
        emit ELOperatorAdded(newELOperator);
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

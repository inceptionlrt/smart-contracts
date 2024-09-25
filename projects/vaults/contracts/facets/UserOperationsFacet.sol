// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.23;

// import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

// import {BeaconProxy, Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

// import {IEigenLayerHandler} from "../interfaces/eigenlayer-vault/IEigenLayerHandler.sol";
// import {IOwnable} from "../interfaces/common/IOwnable.sol";
// import {IInceptionVault_EL} from "../interfaces/eigenlayer-vault/IInceptionVault_EL.sol";
// import {IInceptionToken} from "../interfaces/common/IInceptionToken.sol";
// import {IDelegationManager} from "../interfaces/eigenlayer-vault/eigen-core/IDelegationManager.sol";
// import {IInceptionRatioFeed} from "../interfaces/common/IInceptionRatioFeed.sol";

// import "../handlers/eigenlayer-handler/EigenLayerHandler.sol";

// import {IInceptionVaultErrors} from "../interfaces/common/IInceptionVaultErrors.sol";

// import "hardhat/console.sol";

// contract UserOperationsFacet is
//     ReentrancyGuardUpgradeable,
//     IInceptionVaultErrors
// {
//     uint256[150] private __assetHandlerGap;

//     IERC20 internal _asset;

//     uint256[49] private __gap;

//     IStrategyManager public strategyManager;
//     IStrategy public strategy;

//     uint256 public epoch;

//     /// @dev inception operator
//     address internal _operator;

//     /// @dev represents the pending amount to be redeemed by claimers,
//     /// @notice + amount to undelegate from EigenLayer
//     uint256 public totalAmountToWithdraw;

//     /// @dev represents the amount pending processing until it is claimed
//     /// @dev amount measured in asset
//     uint256 internal _pendingWithdrawalAmount;

//     IDelegationManager public delegationManager;

//     IEigenLayerHandler.Withdrawal[] public claimerWithdrawalsQueue;

//     address internal constant _MOCK_ADDRESS =
//         0x0000000000000000000000000012345000000000;

//     /// @dev heap reserved for the claimers
//     uint256 public redeemReservedAmount;

//     /// @dev EigenLayer operator -> inception staker
//     mapping(address => address) internal _operatorRestakers;
//     address[] public restakers;

//     uint256 public depositBonusAmount;

//     /// @dev measured in percentage, MAX_TARGET_PERCENT - 100%
//     uint256 public targetCapacity;

//     uint256 public constant MAX_TARGET_PERCENT = 100 * 1e18;

//     /// @dev constants are not stored in the storage
//     uint256[50 - 13] private __reserver;

//     /// @dev Inception restaking token
//     IInceptionToken public inceptionToken;

//     /// @dev Reduces rounding issues
//     uint256 public minAmount;

//     mapping(address => IEigenLayerHandler.Withdrawal)
//         private _claimerWithdrawals;

//     /// @dev the unique InceptionVault name
//     string public name;

//     /// @dev Factory variables
//     address private _stakerImplementation;

//     /**
//      *  @dev Flash withdrawal params
//      */

//     /// @dev 100%
//     uint64 public constant MAX_PERCENT = 100 * 1e8;

//     IInceptionRatioFeed public ratioFeed;
//     address public treasury;
//     uint64 public protocolFee;

//     /// @dev deposit bonus
//     uint64 public maxBonusRate;
//     uint64 public optimalBonusRate;
//     uint64 public depositUtilizationKink;

//     /// @dev flash withdrawal fee
//     uint64 public maxFlashFeeRate;
//     uint64 public optimalWithdrawalRate;
//     uint64 public withdrawUtilizationKink;

//     function __beforeDeposit(address receiver, uint256 amount) internal view {
//         if (receiver == address(0)) revert NullParams();
//         if (amount < minAmount) revert LowerMinAmount(minAmount);
//         if (targetCapacity == 0) revert InceptionOnPause();
//         if (!_verifyDelegated()) revert InceptionOnPause();
//     }

//     function __afterDeposit(uint256 iShares) internal pure {
//         if (iShares == 0) revert DepositInconsistentResultedState();
//     }

//     /// @dev Transfers the msg.sender's assets to the vault.
//     /// @dev Mints Inception tokens in accordance with the current ratio.
//     /// @dev Issues the tokens to the specified receiver address.
//     function deposit(uint256 amount, address receiver) external {
//         _deposit(amount, msg.sender, receiver);
//     }

//     function _deposit(
//         uint256 amount,
//         address sender,
//         address receiver
//     ) internal {
//         // transfers assets from the sender and returns the received amount
//         // the actual received amount might slightly differ from the specified amount,
//         // approximately by -2 wei
//         // __beforeDeposit(receiver, amount);
//         // uint256 depositedBefore = totalAssets();
//         // uint256 depositBonus;
//         //uint256 availableBonusAmount = depositBonusAmount;
//         // if (availableBonusAmount > 0) {
//         //     depositBonus = 0;
//         //     if (depositBonus > availableBonusAmount) {
//         //         depositBonus = availableBonusAmount;
//         //         depositBonusAmount = 0;
//         //     } else {
//         //         depositBonusAmount -= depositBonus;
//         //     }
//         //     // emit DepositBonus(depositBonus);
//         // }
//         // get the amount from the sender
//         // _transferAssetFrom(sender, amount);
//         // amount = totalAssets() - depositedBefore;
//         // uint256 iShares = convertToShares(amount + depositBonus);
//         // inceptionToken.mint(receiver, iShares);
//         //  __afterDeposit(iShares);
//         //  emit Deposit(sender, receiver, amount, iShares);
//         //return iShares;
//     }

//     function _transferAssetFrom(address staker, uint256 amount) internal {
//         if (!_asset.transferFrom(staker, address(this), amount))
//             revert TransferAssetFromFailed(address(_asset));
//     }

//     function _transferAssetTo(address receiver, uint256 amount) internal {
//         if (!_asset.transfer(receiver, amount))
//             revert TransferAssetFailed(address(_asset));
//     }

//     function __beforeWithdraw(address receiver, uint256 iShares) internal view {
//         if (iShares == 0) revert NullParams();
//         if (receiver == address(0)) revert NullParams();
//         if (targetCapacity == 0) revert InceptionOnPause();
//         if (treasury == address(0)) revert InceptionOnPause();
//         if (!_verifyDelegated()) revert InceptionOnPause();
//     }

//     /// @dev Performs burning iToken from mgs.sender
//     /// @dev Creates a withdrawal requests based on the current ratio
//     /// @param iShares is measured in Inception token(shares)
//     function withdraw(uint256 iShares, address receiver) external nonReentrant {
//         __beforeWithdraw(receiver, iShares);
//         address claimer = msg.sender;
//         uint256 amount = convertToAssets(iShares);
//         console.log("minAmount: ", minAmount);
//         if (amount < minAmount) revert LowerMinAmount(minAmount);

//         // burn Inception token in view of the current ratio
//         inceptionToken.burn(claimer, iShares);

//         // update global state and claimer's state
//         totalAmountToWithdraw += amount;
//         IEigenLayerHandler.Withdrawal storage genRequest = _claimerWithdrawals[
//             receiver
//         ];
//         genRequest.amount += (amount - 2);
//         claimerWithdrawalsQueue.push(
//             IEigenLayerHandler.Withdrawal({
//                 epoch: claimerWithdrawalsQueue.length,
//                 receiver: receiver,
//                 amount: (amount - 2)
//             })
//         );

//         emit IInceptionVault_EL.Withdraw(
//             claimer,
//             receiver,
//             claimer,
//             amount,
//             iShares
//         );
//     }

//     function flashWithdraw(
//         uint256 iShares,
//         address receiver
//     ) external nonReentrant {
//         __beforeWithdraw(receiver, iShares);

//         address claimer = msg.sender;
//         uint256 amount = convertToAssets(iShares);

//         if (amount < minAmount) revert LowerMinAmount(minAmount);

//         // burn Inception token in view of the current ratio
//         inceptionToken.burn(claimer, iShares);

//         uint256 fee = calculateFlashWithdrawFee(amount);
//         if (fee == 0) revert ZeroFlashWithdrawFee();
//         uint256 protocolWithdrawalFee = (fee * protocolFee) / MAX_PERCENT;

//         amount -= fee;
//         depositBonusAmount += (fee - protocolWithdrawalFee);

//         /// @notice instant transfer fee to the treasury
//         _transferAssetTo(treasury, protocolWithdrawalFee);
//         /// @notice instant transfer amount to the receiver
//         _transferAssetTo(receiver, amount);

//         emit IInceptionVault_EL.FlashWithdraw(
//             claimer,
//             receiver,
//             claimer,
//             amount,
//             iShares,
//             fee
//         );
//     }

//     function redeem(address receiver) external nonReentrant {
//         (bool isAble, uint256[] memory availableWithdrawals) = isAbleToRedeem(
//             receiver
//         );
//         if (!isAble) revert IsNotAbleToRedeem();

//         uint256 numOfWithdrawals = availableWithdrawals.length;
//         uint256[] memory redeemedWithdrawals = new uint256[](numOfWithdrawals);

//         IEigenLayerHandler.Withdrawal storage genRequest = _claimerWithdrawals[
//             receiver
//         ];
//         uint256 redeemedAmount;
//         for (uint256 i = 0; i < numOfWithdrawals; ++i) {
//             uint256 withdrawalNum = availableWithdrawals[i];
//             IEigenLayerHandler.Withdrawal
//                 storage request = claimerWithdrawalsQueue[withdrawalNum];
//             uint256 amount = request.amount;
//             // update the genRequest and the global state
//             genRequest.amount -= amount;

//             totalAmountToWithdraw -= amount;
//             redeemReservedAmount -= amount;
//             redeemedAmount += amount;
//             redeemedWithdrawals[i] = withdrawalNum;

//             delete claimerWithdrawalsQueue[availableWithdrawals[i]];
//         }

//         // let's update the lowest epoch associated with the claimer
//         genRequest.epoch = availableWithdrawals[numOfWithdrawals - 1];

//         _transferAssetTo(receiver, redeemedAmount);

//         emit IInceptionVault_EL.RedeemedRequests(redeemedWithdrawals);
//         emit IInceptionVault_EL.Redeem(msg.sender, receiver, redeemedAmount);
//     }

//     function isAbleToRedeem(
//         address claimer
//     ) public view returns (bool able, uint256[] memory) {
//         // get the general request
//         uint256 index;
//         IEigenLayerHandler.Withdrawal memory genRequest = _claimerWithdrawals[
//             claimer
//         ];
//         uint256[] memory availableWithdrawals = new uint256[](
//             epoch - genRequest.epoch
//         );
//         if (genRequest.amount == 0) return (false, availableWithdrawals);

//         for (uint256 i = 0; i < epoch; ++i) {
//             if (claimerWithdrawalsQueue[i].receiver == claimer) {
//                 able = true;
//                 availableWithdrawals[index] = i;
//                 ++index;
//             }
//         }
//         // decrease arrays
//         if (availableWithdrawals.length - index > 0)
//             assembly {
//                 mstore(availableWithdrawals, index)
//             }

//         return (able, availableWithdrawals);
//     }

//     function calculateFlashWithdrawFee(
//         uint256 amount
//     ) public view returns (uint256) {
//         uint256 capacity = getFlashCapacity();
//         if (amount > capacity) revert InsufficientCapacity(capacity);

//         return
//             InceptionLibrary.calculateWithdrawalFee(
//                 amount,
//                 capacity,
//                 (_getTargetCapacity() * withdrawUtilizationKink) / MAX_PERCENT,
//                 optimalWithdrawalRate,
//                 maxFlashFeeRate,
//                 _getTargetCapacity()
//             );
//     }

//     function getFlashCapacity() public view returns (uint256 total) {
//         return totalAssets() - redeemReservedAmount - depositBonusAmount;
//     }

//     function _getTargetCapacity() internal view returns (uint256) {
//         return (targetCapacity * getTotalDeposited()) / MAX_TARGET_PERCENT;
//     }

//     function getTotalDeposited() public view returns (uint256) {
//         return
//             getTotalDelegated() +
//             totalAssets() +
//             _pendingWithdrawalAmount -
//             depositBonusAmount;
//     }

//     function getTotalDelegated() public view returns (uint256 total) {
//         uint256 stakersNum = restakers.length;
//         for (uint256 i = 0; i < stakersNum; ++i) {
//             if (restakers[i] == address(0)) continue;
//             total += strategy.userUnderlyingView(restakers[i]);
//         }
//         return total + strategy.userUnderlyingView(address(this));
//     }

//     /// @dev returns the balance of iVault in the asset
//     function totalAssets() public view returns (uint256) {
//         return _asset.balanceOf(address(this));
//     }

//     function convertToShares(
//         uint256 assets
//     ) public view returns (uint256 shares) {
//         return Convert.multiplyAndDivideFloor(assets, ratio(), 1e18);
//     }

//     function convertToAssets(
//         uint256 iShares
//     ) public view returns (uint256 assets) {
//         return Convert.multiplyAndDivideFloor(iShares, 1e18, ratio());
//     }

//     function ratio() public view returns (uint256) {
//         return ratioFeed.getRatioFor(address(inceptionToken));
//     }

//     function _verifyDelegated() internal view returns (bool) {
//         for (uint256 i = 0; i < restakers.length; i++) {
//             if (restakers[i] == address(0)) {
//                 continue;
//             }
//             if (!delegationManager.isDelegated(restakers[i])) return false;
//         }

//         if (
//             strategy.userUnderlyingView(address(this)) > 0 &&
//             !delegationManager.isDelegated(address(this))
//         ) return false;

//         return true;
//     }
// }

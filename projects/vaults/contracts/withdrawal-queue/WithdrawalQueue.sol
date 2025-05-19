// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IWithdrawalQueue} from "../interfaces/common/IWithdrawalQueue.sol";

contract WithdrawalQueue is IWithdrawalQueue, Initializable {
    using Math for uint256;

    /// @dev emergency epoch number
    uint256 public constant EMERGENCY_EPOCH = 0;
    /// @dev max threshold while convert shares to assets during undelegate
    uint256 internal constant MAX_CONVERT_THRESHOLD = 50;

    /// @dev withdrawal queue owner
    address public vaultOwner;

    /// @dev withdrawal epochs data
    mapping(uint256 => WithdrawalEpoch) public withdrawals;
    mapping(address => uint256[]) public userEpoch;

    /// @dev global stats across all epochs
    uint256 public currentEpoch;
    uint256 public totalAmountRedeem;
    uint256 public totalSharesToWithdraw;
    uint256 public totalPendingClaimedAmounts;

    modifier onlyVault() {
        require(msg.sender == vaultOwner, OnlyVaultAllowed());
        _;
    }

    /*
    * @notice Initializes the contract with a vault address and legacy withdrawal data
    * @param _vault The address of the vault contract that will interact with this queue
    * @param legacyWithdrawalAddresses Array of addresses with legacy withdrawal requests
    * @param legacyWithdrawalAmounts Array of amounts corresponding to legacy withdrawal requests
    * @param legacyClaimedAmount Total claimed amount for the legacy epoch
    */
    function initialize(
        address _vault,
        address[] calldata legacyWithdrawalAddresses,
        uint256[] calldata legacyWithdrawalAmounts,
        uint256 legacyClaimedAmount
    ) external initializer {
        require(_vault != address(0), ValueZero());
        vaultOwner = _vault;
        currentEpoch = EMERGENCY_EPOCH + 1;

        _initLegacyWithdrawals(
            legacyWithdrawalAddresses,
            legacyWithdrawalAmounts,
            legacyClaimedAmount
        );
    }

    /*
    * @notice Initializes legacy withdrawal data for the first epoch
    * @param legacyWithdrawalAddresses Array of addresses with legacy withdrawal requests
    * @param legacyWithdrawalAmounts Array of amounts corresponding to legacy withdrawal requests
    * @param legacyClaimedAmount Total claimed amount for the legacy epoch
    */
    function _initLegacyWithdrawals(
        address[] calldata legacyWithdrawalAddresses,
        uint256[] calldata legacyWithdrawalAmounts,
        uint256 legacyClaimedAmount
    ) internal onlyInitializing {
        require(legacyWithdrawalAddresses.length == legacyWithdrawalAmounts.length, ValueZero());
        if (legacyWithdrawalAddresses.length == 0) {
            return;
        }

        WithdrawalEpoch storage epoch = withdrawals[currentEpoch];
        epoch.totalClaimedAmount = legacyClaimedAmount;
        epoch.totalRequestedShares = legacyClaimedAmount;
        epoch.ableRedeem = true;

        for (uint256 i = 0; i < legacyWithdrawalAddresses.length; i++) {
            epoch.userShares[legacyWithdrawalAddresses[i]] = legacyWithdrawalAmounts[i];
            addUserEpoch(legacyWithdrawalAddresses[i], currentEpoch);
        }

        // update global state
        totalAmountRedeem += legacyClaimedAmount;

        currentEpoch++;
    }

    /*
    * @notice Requests a withdrawal for a receiver in the current epoch
    * @param receiver The address requesting the withdrawal
    * @param shares The number of shares to request for withdrawal
    */
    function request(address receiver, uint256 shares) external onlyVault {
        require(shares > 0, ValueZero());
        require(receiver != address(0), ValueZero());

        WithdrawalEpoch storage withdrawal = withdrawals[currentEpoch];
        withdrawal.userShares[receiver] += shares;
        withdrawal.totalRequestedShares += shares;
        totalSharesToWithdraw += shares;

        addUserEpoch(receiver, currentEpoch);
    }

    /*
    * @notice Adds an epoch to the user's list of epochs if not already present
    * @param receiver The address of the user
    * @param epoch The epoch number to add
    */
    function addUserEpoch(address receiver, uint256 epoch) private {
        uint256[] storage receiverEpochs = userEpoch[receiver];
        if (receiverEpochs.length == 0 || receiverEpochs[receiverEpochs.length - 1] != epoch) {
            receiverEpochs.push(epoch);
        }
    }

    /*
    * @notice Processes undelegation for multiple adapters and vaults in a given epoch
    * @param epoch The epoch to undelegate from (must match current epoch)
    * @param adapters Array of adapter addresses
    * @param vaults Array of vault addresses
    * @param undelegatedAmounts Array of undelegated amounts
    * @param claimedAmounts Array of claimed amounts
    */
    function undelegate(
        uint256 epoch,
        address[] calldata adapters,
        address[] calldata vaults,
        uint256[] calldata undelegatedAmounts,
        uint256[] calldata claimedAmounts
    ) external onlyVault {
        require(epoch >= 0 && epoch <= currentEpoch, UndelegateEpochMismatch());
        WithdrawalEpoch storage withdrawal = withdrawals[epoch];

        for (uint256 i = 0; i < adapters.length; i++) {
            _undelegate(
                withdrawal,
                adapters[i],
                vaults[i],
                undelegatedAmounts[i],
                claimedAmounts[i]
            );
        }

        _afterUndelegate(epoch, withdrawal);
    }

    /*
    * @notice Internal function to process undelegation for a specific adapter and vault
    * @param withdrawal The storage reference to the withdrawal epoch
    * @param adapter The adapter address
    * @param vault The vault address
    * @param undelegatedAmount The amount undelegated
    * @param claimedAmount The amount claimed
    */
    function _undelegate(
        WithdrawalEpoch storage withdrawal,
        address adapter,
        address vault,
        uint256 undelegatedAmount,
        uint256 claimedAmount
    ) internal {
        require(undelegatedAmount > 0 || claimedAmount > 0, ValueZero());

        // update withdrawal data
        withdrawal.adapterUndelegated[adapter][vault] = undelegatedAmount;
        withdrawal.totalUndelegatedAmount += undelegatedAmount;
        withdrawal.adaptersUndelegatedCounter++;

        if (claimedAmount > 0) {
            withdrawal.totalClaimedAmount += claimedAmount;
        }

        if (claimedAmount > 0 && undelegatedAmount == 0) {
            withdrawal.adaptersClaimedCounter++;
        }
    }

    /*
    * @notice Finalizes undelegation by advancing the epoch if completed
    * @param withdrawal The storage reference to the withdrawal epoch
    */
    function _afterUndelegate(uint256 epoch, WithdrawalEpoch storage withdrawal) internal {
        uint256 requested = IERC4626(vaultOwner).convertToAssets(withdrawal.totalRequestedShares);
        uint256 totalUndelegated = withdrawal.totalUndelegatedAmount + withdrawal.totalClaimedAmount;

        require(
            requested >= totalUndelegated ?
                requested - totalUndelegated <= MAX_CONVERT_THRESHOLD
                : totalUndelegated - requested <= MAX_CONVERT_THRESHOLD,
            UndelegateNotCompleted()
        );

        if (withdrawal.totalClaimedAmount > 0 && withdrawal.totalUndelegatedAmount == 0) {
            _makeRedeemable(withdrawal);
        }

        if (epoch == currentEpoch) {
            currentEpoch++;
        }
    }

    /*
    * @notice Claims an amount for a specific adapter and vault in an epoch
    * @param epoch The epoch to claim from
    * @param adapters Array of adapter addresses
    * @param vaults Array of vault addresses
    * @param claimedAmounts Array of claimed amounts
    */
    function claim(
        uint256 epoch,
        address[] calldata adapters,
        address[] calldata vaults,
        uint256[] calldata claimedAmounts
    ) external onlyVault {
        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        require(!withdrawal.ableRedeem, EpochAlreadyRedeemable());

        if (epoch == EMERGENCY_EPOCH) {
            // do nothing
            return;
        }

        for (uint256 i = 0; i < adapters.length; i++) {
            _claim(withdrawal, adapters[i], vaults[i], claimedAmounts[i]);
        }

        _afterClaim(withdrawal);
    }

    /*
    * @notice Claims an amount for a specific adapter and vault in an epoch
    * @param withdrawal The storage reference to the withdrawal epoch
    * @param adapter The adapter address
    * @param vault The vault address
    * @param claimedAmount The amount to claim
    */
    function _claim(
        WithdrawalEpoch storage withdrawal,
        address adapter,
        address vault,
        uint256 claimedAmount
    ) internal {
        require(withdrawal.adapterUndelegated[adapter][vault] > 0, ClaimUnknownAdapter());

        // update withdrawal state
        withdrawal.totalClaimedAmount += claimedAmount;
        withdrawal.adaptersClaimedCounter++;
    }

    /*
    * @notice Updates the redeemable status after a claim
    * @param withdrawal The storage reference to the withdrawal epoch
    */
    function _afterClaim(WithdrawalEpoch storage withdrawal) internal {
        _isSlashed(withdrawal) ? _resetEpoch(withdrawal) : _makeRedeemable(withdrawal);
    }

    /*
    * @notice Checks if a withdrawal epoch is considered slashed based on the difference between claimed and current amounts.
    * @dev Compares the current asset value of requested shares against the total claimed amount, considering a maximum threshold.
    * @param withdrawal The storage reference to the WithdrawalEpoch struct.
    * @return bool True if the withdrawal is slashed, false otherwise.
    */
    function _isSlashed(WithdrawalEpoch storage withdrawal) internal returns (bool) {
        uint256 currentAmount = IERC4626(vaultOwner).convertToAssets(withdrawal.totalRequestedShares);

        if (withdrawal.totalClaimedAmount >= withdrawal.totalUndelegatedAmount) {
            if (currentAmount < withdrawal.totalClaimedAmount && withdrawal.totalClaimedAmount - currentAmount > MAX_CONVERT_THRESHOLD) {
                return true;
            }
        } else if (currentAmount > withdrawal.totalClaimedAmount && currentAmount - withdrawal.totalClaimedAmount > MAX_CONVERT_THRESHOLD) {
            return true;
        } else if (currentAmount < withdrawal.totalClaimedAmount && withdrawal.totalClaimedAmount - currentAmount > MAX_CONVERT_THRESHOLD) {
            return true;
        }

        return false;
    }

    /*
    * @notice Marks a withdrawal epoch as redeemable and updates global state
    * @dev Ensures all adapters have completed claiming by checking if the claimed counter equals the undelegated counter.
    *      Sets the epoch as redeemable, updates the total redeemable amount, and reduces the total shares queued for withdrawal
    * @param withdrawal The storage reference to the withdrawal epoch
    */
    function _makeRedeemable(WithdrawalEpoch storage withdrawal) internal {
        require(withdrawal.adaptersClaimedCounter == withdrawal.adaptersUndelegatedCounter, ClaimNotCompleted());
        withdrawal.ableRedeem = true;
        totalAmountRedeem += withdrawal.totalClaimedAmount;
        totalSharesToWithdraw -= withdrawal.totalRequestedShares;
    }

    /*
    * @notice Resets the state of a withdrawal epoch to its initial values.
    * @dev Clears the total claimed amount, total undelegated amount, and adapter counters for the specified withdrawal epoch.
    * @param withdrawal The storage reference to the WithdrawalEpoch struct to be refreshed.
    */
    function _resetEpoch(WithdrawalEpoch storage withdrawal) internal {
        withdrawal.totalClaimedAmount = 0;
        withdrawal.totalUndelegatedAmount = 0;
        withdrawal.adaptersClaimedCounter = 0;
        withdrawal.adaptersUndelegatedCounter = 0;
    }

    /*
    * @notice Forces undelegation and claims a specified amount for the current epoch
    * @param epoch The epoch number to process, must match the current epoch
    * @param claimedAmount The amount to claim, must not exceed totalAmountRedeemFree
    */
    function forceUndelegateAndClaim(uint256 epoch, uint256 claimedAmount) external onlyVault {
        require(epoch <= currentEpoch, UndelegateEpochMismatch());

        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        require(!withdrawal.ableRedeem, EpochAlreadyRedeemable());

        // update epoch state
        withdrawal.totalClaimedAmount = claimedAmount;

        _afterUndelegate(epoch, withdrawal);
    }

    /*
    * @notice Redeems available amounts for a receiver across their epochs
    * @param receiver The address to redeem for
    * @return amount The total amount redeemed
    */
    function redeem(address receiver) external onlyVault returns (uint256 amount) {
        uint256[] storage epochs = userEpoch[receiver];
        uint256 i = 0;

        while (i < epochs.length) {
            uint256 redeemAmount = _redeem(receiver, epochs, i);
            if (redeemAmount == 0) {
                ++i;
                continue;
            }

            amount += redeemAmount;
        }

        if (epochs.length == 0) {
            delete userEpoch[receiver];
        }

        return amount;
    }

    /*
    * @notice Redeems available amounts for a receiver with given epoch index
    * @param receiver The address to redeem for
    * @param userEpochIndex user epoch index
    * @return amount The total amount redeemed
    */
    function redeem(address receiver, uint256 userEpochIndex) external onlyVault returns (uint256 amount) {
        uint256[] storage epochs = userEpoch[receiver];
        require(userEpochIndex < epochs.length, InvalidEpoch());

        uint256 amount = _redeem(receiver, epochs, userEpochIndex);

        if (epochs.length == 0) {
            delete userEpoch[receiver];
        }

        return amount;
    }

    /*
    * @notice Redeems the available amount for a receiver in a specific epoch
    * @dev Processes the redemption by checking if the withdrawal is redeemable and if the receiver has shares.
    *      Calculates the redeemable amount, clears the receiver's shares, removes the epoch from the user's epoch list,
    *      and updates the global total redeemed amount
    * @param receiver The address of the user redeeming the amount
    * @param epochs The storage array of epoch indexes for the user
    * @param userEpochIndex The index of the epoch in the user's epoch list
    * @return amount The amount redeemed for the receiver
    */
    function _redeem(address receiver, uint256[] storage epochs, uint256 userEpochIndex) internal returns (uint256 amount) {
        WithdrawalEpoch storage withdrawal = withdrawals[epochs[userEpochIndex]];
        if (!withdrawal.ableRedeem || withdrawal.userShares[receiver] == 0) {
            return 0;
        }

        amount = _getRedeemAmount(withdrawal, receiver);
        withdrawal.userShares[receiver] = 0;

        epochs[userEpochIndex] = epochs[epochs.length - 1];
        epochs.pop();

        // update global state
        totalAmountRedeem -= amount;

        return amount;
    }

    /*
    * @notice Calculates the redeemable amount for a user in an epoch quả
    * @param withdrawal The storage reference to the withdrawal epoch
    * @param receiver The address of the user
    * @return The calculated redeemable amount
    */
    function _getRedeemAmount(WithdrawalEpoch storage withdrawal, address receiver) internal view returns (uint256) {
        return withdrawal.totalClaimedAmount.mulDiv(
            withdrawal.userShares[receiver],
            withdrawal.totalRequestedShares,
            Math.Rounding.Down
        );
    }

    /*//////////////////////
    //// GET functions ////
    ////////////////////*/

    /*
    * @notice Retrieves the total number of requested shares for a specific epoch
    * @param epoch The epoch number for which to retrieve the requested shares
    * @return The total number of shares requested in the specified epoch
    */
    function getRequestedShares(uint256 epoch) external view returns (uint256) {
        return withdrawals[epoch].totalRequestedShares;
    }

    /*
    * @notice Returns the total pending withdrawal amount for a receiver
    * @param receiver The address to check
    * @return amount The total pending withdrawal amount
    */
    function getPendingWithdrawalOf(address receiver) external view returns (uint256 amount) {
        uint256[] memory epochs = userEpoch[receiver];
        for (uint256 i = 0; i < epochs.length; i++) {
            WithdrawalEpoch storage withdrawal = withdrawals[epochs[i]];
            if (withdrawal.userShares[receiver] == 0) {
                continue;
            }

            if (withdrawal.ableRedeem) amount += _getRedeemAmount(withdrawal, receiver);
            else amount += IERC4626(vaultOwner).convertToAssets(withdrawal.userShares[receiver]);
        }

        return amount;
    }

    /*
    * @notice Checks if a claimer has redeemable withdrawals and their epoch indexes inside userEpoch mapping
    * @param claimer The address to check
    * @return able Whether there are redeemable withdrawals
    * @return withdrawalIndexes Array of user epoch indexes with redeemable withdrawals
    */
    function isRedeemable(address claimer) external view returns (bool able, uint256[] memory withdrawalIndexes) {
        uint256 index;

        uint256[] memory epochs = userEpoch[claimer];
        withdrawalIndexes = new uint256[](epochs.length);

        for (uint256 i = 0; i < epochs.length; i++) {
            WithdrawalEpoch storage withdrawal = withdrawals[epochs[i]];
            if (!withdrawal.ableRedeem || withdrawal.userShares[claimer] == 0) {
                continue;
            }

            able = true;
            withdrawalIndexes[index] = i;
            ++index;
        }

        return (able, withdrawalIndexes);
    }
}
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

    /// @notice Initializes the contract with a vault address and legacy withdrawal data
    /// @param _vault The address of the vault contract that will interact with this queue
    /// @param legacyWithdrawalAddresses Array of addresses with legacy withdrawal requests
    /// @param legacyWithdrawalAmounts Array of amounts corresponding to legacy withdrawal requests
    /// @param legacyClaimedAmount Total claimed amount for the legacy epoch
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

    modifier onlyVault() {
        require(msg.sender == vaultOwner, OnlyVaultAllowed());
        _;
    }

    /// @notice Initializes legacy withdrawal data for the first epoch
    /// @param legacyWithdrawalAddresses Array of addresses with legacy withdrawal requests
    /// @param legacyWithdrawalAmounts Array of amounts corresponding to legacy withdrawal requests
    /// @param legacyClaimedAmount Total claimed amount for the legacy epoch
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

    /// @notice Requests a withdrawal for a receiver in the current epoch
    /// @param receiver The address requesting the withdrawal
    /// @param shares The number of shares to request for withdrawal
    function request(address receiver, uint256 shares) external onlyVault {
        require(shares > 0, ValueZero());
        require(receiver != address(0), ValueZero());

        WithdrawalEpoch storage withdrawal = withdrawals[currentEpoch];
        withdrawal.userShares[receiver] += shares;
        withdrawal.totalRequestedShares += shares;
        totalSharesToWithdraw += shares;

        addUserEpoch(receiver, currentEpoch);
    }

    /// @notice Adds an epoch to the user's list of epochs if not already present
    /// @param receiver The address of the user
    /// @param epoch The epoch number to add
    function addUserEpoch(address receiver, uint256 epoch) private {
        uint256[] storage receiverEpochs = userEpoch[receiver];
        if (receiverEpochs.length == 0 || receiverEpochs[receiverEpochs.length - 1] != epoch) {
            receiverEpochs.push(epoch);
        }
    }

    /// @notice Processes undelegation for multiple adapters and vaults in a given epoch
    /// @param epoch The epoch to undelegate from (must match current epoch)
    /// @param adapters Array of adapter addresses
    /// @param vaults Array of vault addresses
    /// @param undelegatedAmounts Array of undelegated amounts
    /// @param claimedAmounts Array of claimed amounts
    function undelegate(
        uint256 epoch,
        address[] calldata adapters,
        address[] calldata vaults,
        uint256[] calldata undelegatedAmounts,
        uint256[] calldata claimedAmounts
    ) external onlyVault {
        require(epoch == currentEpoch, UndelegateEpochMismatch());
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

        // update global state
        totalSharesToWithdraw -= withdrawal.totalRequestedShares;

        _afterUndelegate(withdrawal);
    }

    /// @notice Internal function to process undelegation for a specific adapter and vault
    /// @param withdrawal The storage reference to the withdrawal epoch
    /// @param adapter The adapter address
    /// @param vault The vault address
    /// @param undelegatedAmount The amount undelegated
    /// @param claimedAmount The amount claimed
    function _undelegate(
        WithdrawalEpoch storage withdrawal,
        address adapter,
        address vault,
        uint256 undelegatedAmount,
        uint256 claimedAmount
    ) internal {
        require(withdrawal.adapterUndelegated[adapter][vault] == 0, AdapterVaultAlreadyUndelegated());
        require(undelegatedAmount > 0 || claimedAmount > 0, ValueZero());

        // update withdrawal data
        withdrawal.adapterUndelegated[adapter][vault] += undelegatedAmount;
        withdrawal.totalUndelegatedAmount += undelegatedAmount;
        withdrawal.adaptersUndelegatedCounter++;

        if (claimedAmount > 0) {
            totalAmountRedeem += claimedAmount;
            withdrawal.totalClaimedAmount += claimedAmount;
        }

        if (claimedAmount > 0 && undelegatedAmount == 0) {
            withdrawal.adaptersClaimedCounter++;
        }
    }

    /// @notice Finalizes undelegation by advancing the epoch if completed
    /// @param withdrawal The storage reference to the withdrawal epoch
    function _afterUndelegate(WithdrawalEpoch storage withdrawal) internal {
        uint256 requested = IERC4626(vaultOwner).convertToAssets(withdrawal.totalRequestedShares);
        uint256 totalUndelegated = withdrawal.totalUndelegatedAmount + withdrawal.totalClaimedAmount;

        require(
            requested >= totalUndelegated ?
                requested - totalUndelegated <= MAX_CONVERT_THRESHOLD
                : totalUndelegated - requested <= MAX_CONVERT_THRESHOLD,
            UndelegateNotCompleted()
        );

        currentEpoch++;

        if (withdrawal.totalClaimedAmount > 0 && withdrawal.totalUndelegatedAmount == 0) {
            withdrawal.ableRedeem = true;
        }
    }

    /// @notice Claims an amount for a specific adapter and vault in an epoch
    /// @param epoch The epoch to claim from
    /// @param adapters Array of adapter addresses
    /// @param vaults Array of vault addresses
    /// @param claimedAmounts Array of claimed amounts
    function claim(
        uint256 epoch,
        address[] calldata adapters,
        address[] calldata vaults,
        uint256[] calldata claimedAmounts
    ) external onlyVault {
        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        require(withdrawal.ableRedeem == false, EpochAlreadyRedeemable());

        if (epoch == EMERGENCY_EPOCH) {
            // do nothing
            return;
        }

        for (uint256 i = 0; i < adapters.length; i++) {
            _claim(withdrawal, adapters[i], vaults[i], claimedAmounts[i]);
        }

        _afterClaim(withdrawal);
    }

    /// @notice Claims an amount for a specific adapter and vault in an epoch
    /// @param withdrawal The storage reference to the withdrawal epoch
    /// @param adapter The adapter address
    /// @param vault The vault address
    /// @param claimedAmount The amount to claim
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

        // update global state
        totalAmountRedeem += claimedAmount;
    }

    /// @notice Updates the redeemable status after a claim
    /// @param withdrawal The storage reference to the withdrawal epoch
    function _afterClaim(WithdrawalEpoch storage withdrawal) internal {
        require(withdrawal.adaptersClaimedCounter == withdrawal.adaptersUndelegatedCounter, ClaimNotCompleted());
        withdrawal.ableRedeem = true;
    }

    /// @notice Forces undelegation and claims a specified amount for the current epoch.
    /// @param epoch The epoch number to process, must match the current epoch.
    /// @param claimedAmount The amount to claim, must not exceed totalAmountRedeemFree.
    function forceUndelegateAndClaim(uint256 epoch, uint256 claimedAmount) external onlyVault {
        require(epoch == currentEpoch, UndelegateEpochMismatch());

        // update epoch state
        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        withdrawal.ableRedeem = true;
        withdrawal.totalClaimedAmount = claimedAmount;

        // update global state
        totalAmountRedeem += claimedAmount;
        totalSharesToWithdraw -= withdrawal.totalRequestedShares;

        // update epoch
        currentEpoch++;
    }

    /// @notice Redeems available amounts for a receiver across their epochs
    /// @param receiver The address to redeem for
    /// @return amount The total amount redeemed
    function redeem(address receiver) external onlyVault returns (uint256 amount) {
        uint256[] storage epochs = userEpoch[receiver];
        uint256 i = 0;

        while (i < epochs.length) {
            WithdrawalEpoch storage withdrawal = withdrawals[epochs[i]];
            if (!withdrawal.ableRedeem || withdrawal.userShares[receiver] == 0) {
                ++i;
                continue;
            }

            amount += _getRedeemAmount(withdrawal, receiver);
            withdrawal.userShares[receiver] = 0;

            epochs[i] = epochs[epochs.length - 1];
            epochs.pop();
        }

        if (epochs.length == 0) {
            delete userEpoch[receiver];
        }

        // update global state
        totalAmountRedeem -= amount;

        return amount;
    }

    function redeem(address receiver, uint256 userEpochIndex) external onlyVault returns (uint256 amount) {
        uint256[] storage epochs = userEpoch[receiver];
        require(userEpochIndex < epochs.length, "Invalid epoch index");

        WithdrawalEpoch storage withdrawal = withdrawals[epochs[userEpochIndex]];
        if (!withdrawal.ableRedeem || withdrawal.userShares[receiver] == 0) {
            return 0;
        }

        amount = _getRedeemAmount(withdrawal, receiver);
        withdrawal.userShares[receiver] = 0;

        epochs[userEpochIndex] = epochs[epochs.length - 1];
        epochs.pop();

        if (epochs.length == 0) {
            delete userEpoch[receiver];
        }

        // Update global state
        totalAmountRedeem -= amount;

        return amount;
    }

    /// @notice Calculates the redeemable amount for a user in an epoch
    /// @param withdrawal The storage reference to the withdrawal epoch
    /// @param receiver The address of the user
    /// @return The calculated redeemable amount
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

    /// @notice Retrieves the total number of requested shares for a specific epoch.
    /// @param epoch The epoch number for which to retrieve the requested shares.
    /// @return The total number of shares requested in the specified epoch.
    function getRequestedShares(uint256 epoch) external view returns (uint256) {
        return withdrawals[epoch].totalRequestedShares;
    }

    /// @notice Returns the total pending withdrawal amount for a receiver
    /// @param receiver The address to check
    /// @return amount The total pending withdrawal amount
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

    /// @notice Checks if a claimer has redeemable withdrawals and their epoch indexes
    /// @param claimer The address to check
    /// @return able Whether there are redeemable withdrawals
    /// @return withdrawalIndexes Array of epoch indexes with redeemable withdrawals
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
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IWithdrawalQueue} from "../interfaces/common/IWithdrawalQueue.sol";

contract WithdrawalQueue is IWithdrawalQueue, Initializable {
    using Math for uint256;

    /// @dev withdrawal queue owner
    address public vaultOwner;

    /// @dev withdrawal epochs data
    mapping(uint256 => WithdrawalEpoch) public withdrawals;
    mapping(address => uint256[]) public userEpoch;

    /// @dev global stats across all epochs
    uint256 public currentEpoch;
    uint256 public totalAmountToWithdraw;
    uint256 public totalAmountUndelegated;
    uint256 public totalAmountRedeem;

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
        _initLegacyWithdrawals(legacyWithdrawalAddresses, legacyWithdrawalAmounts, legacyClaimedAmount);
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
    ) internal initializer {
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

        totalAmountToWithdraw += legacyClaimedAmount;
        totalAmountRedeem += legacyClaimedAmount;

        currentEpoch++;
    }

    /// @notice Requests a withdrawal for a receiver in the current epoch
    /// @param receiver The address requesting the withdrawal
    /// @param shares The number of shares to request for withdrawal
    function request(address receiver, uint256 shares) external onlyVault {
        require(shares > 0, ValueZero());

        WithdrawalEpoch storage withdrawal = withdrawals[currentEpoch];
        withdrawal.userShares[receiver] += shares;
        withdrawal.totalRequestedShares += shares;

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
    /// @param shares Array of share amounts to undelegate
    /// @param undelegatedAmounts Array of undelegated amounts
    /// @param claimedAmounts Array of claimed amounts
    function undelegate(
        uint256 epoch,
        address[] calldata adapters,
        address[] calldata vaults,
        uint256[] calldata shares,
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
                shares[i],
                undelegatedAmounts[i],
                claimedAmounts[i]
            );
        }

        _afterUndelegate(withdrawal);
    }

    /// @notice Make undelegation without epoch
    /// @param undelegatedAmount The amount to add to undelegated totals
    /// @param claimedAmount The amount to add to withdrawal totals if claimed
    function undelegate(uint256 undelegatedAmount, uint256 claimedAmount) external onlyVault {
        totalAmountToWithdraw += undelegatedAmount;
        totalAmountUndelegated += undelegatedAmount;
        if (claimedAmount > 0) {
            totalAmountToWithdraw += claimedAmount;
        }
    }

    /// @notice Internal function to process undelegation for a specific adapter and vault
    /// @param withdrawal The storage reference to the withdrawal epoch
    /// @param adapter The adapter address
    /// @param vault The vault address
    /// @param shares The number of shares to undelegate
    /// @param undelegatedAmount The amount undelegated
    /// @param claimedAmount The amount claimed
    function _undelegate(
        WithdrawalEpoch storage withdrawal,
        address adapter,
        address vault,
        uint256 shares,
        uint256 undelegatedAmount,
        uint256 claimedAmount
    ) internal {
        require(shares > 0, ValueZero());
        require(withdrawal.totalUndelegatedShares + shares <= withdrawal.totalRequestedShares, UndelegateExceedRequested());
        require(withdrawal.adapterUndelegated[adapter][vault] == 0, AdapterVaultAlreadyUndelegated());

        // update withdrawal data
        withdrawal.adapterUndelegated[adapter][vault] += undelegatedAmount;
        withdrawal.totalUndelegatedAmount += undelegatedAmount;
        withdrawal.totalUndelegatedShares += shares;
        withdrawal.adaptersUndelegatedCounter++;

        // update global data
        totalAmountUndelegated += undelegatedAmount;
        totalAmountToWithdraw += undelegatedAmount;

        if (claimedAmount > 0) {
            withdrawal.totalClaimedAmount += claimedAmount;
            totalAmountRedeem += claimedAmount;
            totalAmountToWithdraw += claimedAmount;

            if (undelegatedAmount == 0) {
                withdrawal.adaptersClaimedCounter++;
            }
        }
    }

    /// @notice Finalizes undelegation by advancing the epoch if completed
    /// @param withdrawal The storage reference to the withdrawal epoch
    function _afterUndelegate(WithdrawalEpoch storage withdrawal) internal {
        require(withdrawal.totalRequestedShares == withdrawal.totalUndelegatedShares, UndelegateNotCompleted());
        currentEpoch++;

        if (withdrawal.totalClaimedAmount > 0 && withdrawal.totalUndelegatedAmount == 0) {
            withdrawal.ableRedeem = true;
        }
    }

    /// @notice Claims an amount for a specific adapter and vault in an epoch
    /// @param epoch The epoch to claim from
    /// @param adapter The adapter address
    /// @param vault The vault address
    /// @param claimedAmount The amount to claim
    function claim(uint256 epoch, address adapter, address vault, uint256 claimedAmount) external onlyVault {
        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        require(withdrawal.adapterUndelegated[adapter][vault] > 0, ClaimUnknownAdapter());
        require(withdrawal.adapterClaimed[adapter][vault] == 0, AdapterAlreadyClaimed());
        require(withdrawal.adapterUndelegated[adapter][vault] >= claimedAmount, ClaimedExceedUndelegated());

        // update withdrawal state
        withdrawal.adapterClaimed[adapter][vault] += claimedAmount;
        withdrawal.totalClaimedAmount += claimedAmount;
        withdrawal.adaptersClaimedCounter++;

        // update global state
        totalAmountRedeem += claimedAmount;
        totalAmountToWithdraw -= withdrawal.adapterUndelegated[adapter][vault] - claimedAmount; // difference means slash
        totalAmountUndelegated -= withdrawal.adapterUndelegated[adapter][vault];

        _afterClaim(withdrawal);
    }

    /// @notice Reduces the total undelegated amount by a claimed amount
    /// @param claimedAmount The amount to subtract from undelegated totals
    function claim(uint256 claimedAmount) external onlyVault {
        totalAmountUndelegated -= claimedAmount;
    }

    /// @notice Updates the redeemable status after a claim
    /// @param withdrawal The storage reference to the withdrawal epoch
    function _afterClaim(WithdrawalEpoch storage withdrawal) internal {
        if (withdrawal.adaptersClaimedCounter == withdrawal.adaptersUndelegatedCounter) withdrawal.ableRedeem = true;
    }

    /// @notice Redeems available amounts for a receiver across their epochs
    /// @param receiver The address to redeem for
    /// @return amount The total amount redeemed
    function redeem(address receiver) external onlyVault returns (uint256 amount) {
        uint256[] storage epochs = userEpoch[receiver];
        uint256 i = 0;

        while (i < epochs.length) {
            WithdrawalEpoch storage withdrawal = withdrawals[epochs[i]];
            if (!withdrawal.ableRedeem || withdrawal.userRedeemed[receiver]) {
                ++i;
                continue;
            }

            withdrawal.userRedeemed[receiver] = true;
            amount += _getRedeemAmount(withdrawal, receiver);

            epochs[i] = epochs[epochs.length - 1];
            epochs.pop();
        }

        if(epochs.length == 0) {
            delete userEpoch[receiver];
        }

        totalAmountRedeem -= amount;
        totalAmountToWithdraw -= amount;

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

    /// @notice Returns the total pending withdrawal amount for a receiver
    /// @param receiver The address to check
    /// @return amount The total pending withdrawal amount
    function getPendingWithdrawalOf(address receiver) external view returns (uint256 amount) {
        uint256[] memory epochs = userEpoch[receiver];
        for (uint256 i = 0; i < epochs.length; i++) {
            WithdrawalEpoch storage withdrawal = withdrawals[epochs[i]];
            if (withdrawal.userRedeemed[receiver]) {
                continue;
            }

            if (withdrawal.ableRedeem) {
                amount += _getRedeemAmount(withdrawal, receiver);
            } else {
                amount += IERC4626(vaultOwner).convertToAssets(withdrawal.userShares[receiver]);
            }
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
            if (!withdrawal.ableRedeem || withdrawal.userRedeemed[claimer]) {
                continue;
            }

            able = true;
            withdrawalIndexes[index] = i;
            ++index;
        }

        return (able, withdrawalIndexes);
    }
}
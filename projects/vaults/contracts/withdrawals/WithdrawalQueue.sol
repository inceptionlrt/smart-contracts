// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {IWithdrawalQueue} from "../interfaces/common/IWithdrawalQueue.sol";

contract WithdrawalQueue is IWithdrawalQueue, ReentrancyGuardUpgradeable {
    using Math for uint256;

    address public vaultOwner;

    mapping(uint256 => WithdrawalEpoch) public withdrawals;
    mapping(address => uint256[]) internal userEpoch;

    uint256 public currentEpoch;
    uint256 public totalAmountToWithdraw;
    uint256 public totalAmountUndelegated;
    uint256 public totalAmountRedeem;

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

    function request(address receiver, uint256 shares) external onlyVault nonReentrant {
        require(shares > 0, ValueZero());

        WithdrawalEpoch storage withdrawal = withdrawals[currentEpoch];
        withdrawal.userShares[receiver] += shares;
        withdrawal.totalRequestedShares += shares;

        addUserEpoch(receiver, currentEpoch);
    }

    function addUserEpoch(address receiver, uint256 epoch) private {
        uint256[] storage receiverEpochs = userEpoch[receiver];
        if (receiverEpochs.length == 0 || receiverEpochs[receiverEpochs.length - 1] != epoch) {
            receiverEpochs.push(epoch);
        }
    }

    function undelegate(
        uint256 epoch,
        address[] calldata adapters,
        address[] calldata vaults,
        uint256[] calldata shares,
        uint256[] calldata undelegatedAmounts,
        uint256[] calldata claimedAmounts
    ) external onlyVault nonReentrant {
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

    function undelegate(uint256 undelegatedAmount, uint256 claimedAmount) external onlyVault nonReentrant {
        totalAmountToWithdraw += undelegatedAmount;
        totalAmountUndelegated += undelegatedAmount;

        if (claimedAmount > 0) {
            totalAmountToWithdraw += claimedAmount;
        }
    }

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

            // todo: check
            if (undelegatedAmount == 0) {
                withdrawal.ableRedeem = true;
            }
        }
    }

    function _afterUndelegate(WithdrawalEpoch storage withdrawal) internal {
        require(withdrawal.totalRequestedShares == withdrawal.totalUndelegatedShares, UndelegateNotCompleted());
        currentEpoch++;
    }

    function claim(uint256 epoch, address adapter, address vault, uint256 claimedAmount) external onlyVault nonReentrant {
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

    function claim(uint256 claimedAmount) external onlyVault nonReentrant {
        totalAmountUndelegated -= claimedAmount;
    }

    function _afterClaim(WithdrawalEpoch storage withdrawal) internal {
        if (withdrawal.adaptersClaimedCounter == withdrawal.adaptersUndelegatedCounter) withdrawal.ableRedeem = true;
    }

    function redeem(address receiver) external onlyVault nonReentrant returns (uint256 amount) {
        uint256[] storage epochs = userEpoch[receiver];
        for (uint256 i = 0; i < epochs.length; i++) {
            WithdrawalEpoch storage withdrawal = withdrawals[epochs[i]];
            if (!withdrawal.ableRedeem || withdrawal.userRedeemed[receiver]) {
                continue;
            }

            withdrawal.userRedeemed[receiver] = true;
            amount += _getRedeemAmount(withdrawal, receiver);
        }

        totalAmountRedeem -= amount;
        totalAmountToWithdraw -= amount;

        return amount;
    }

    function _getRedeemAmount(WithdrawalEpoch storage withdrawal, address receiver) internal view returns (uint256) {
        return withdrawal.totalClaimedAmount.mulDiv(
            withdrawal.userShares[receiver],
            withdrawal.totalRequestedShares,
            Math.Rounding.Down
        );
    }

    /*//////////////////////
    //// View functions ////
    ////////////////////*/

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
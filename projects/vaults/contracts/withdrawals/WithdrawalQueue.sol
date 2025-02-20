// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/math/Math.sol";
import {IWithdrawalQueue} from "../interfaces/common/IWithdrawalQueue.sol";
import "hardhat/console.sol";

contract WithdrawalQueue is IWithdrawalQueue {
    using Math for uint256;

    mapping(uint256 => WithdrawalEpoch) internal withdrawals;
    mapping(address => uint256[]) internal userEpoch;

    uint256 internal epoch;

    uint256 internal totalAmountToWithdraw;
    uint256 internal totalAmountUndelegated;
    uint256 internal totalAmountRedeem;

    function request(address receiver, uint256 amount) external {
        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        withdrawal.totalAmountToClaim += amount;
        withdrawal.userClaimAmount[receiver] += amount;

        totalAmountToWithdraw += amount;

        addUserEpoch(receiver, epoch);
    }

    function addUserEpoch(address receiver, uint256 epochNum) private {
        uint256[] storage receiverEpochs = userEpoch[receiver];
        if (receiverEpochs.length == 0 || receiverEpochs[receiverEpochs.length - 1] != epochNum) {
            receiverEpochs.push(epochNum);
        }
    }

    function undelegate(address adapter, uint256 undelegateAmount) external returns (uint256) {
        uint256 undelegatedEpoch = epoch;

        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        withdrawal.adapterUndelegated[adapter] += undelegateAmount;
        withdrawal.totalUndelegatedAmount += undelegateAmount;

        if (withdrawal.totalUndelegatedAmount == withdrawal.totalAmountToClaim) {
            epoch++;
        }

        totalAmountUndelegated += undelegateAmount;
        return undelegatedEpoch;
    }

    function claim(address adapter, uint256 epochNum, uint256 claimedAmount) external {
        WithdrawalEpoch storage withdrawal = withdrawals[epochNum];
        require(withdrawal.adapterUndelegated[adapter] > 0, "unknown adapter claim");
        require(withdrawal.adapterClaimed[adapter] == 0, "adapter already claimed for given epoch");

        uint256 slashedAmount;
        if (withdrawal.adapterUndelegated[adapter] > claimedAmount) {
            slashedAmount = withdrawal.adapterUndelegated[adapter] - claimedAmount;
            withdrawal.totalSlashedAmount += slashedAmount;
        }

        withdrawal.totalClaimedAmount += claimedAmount;
        withdrawal.adapterClaimed[adapter] += claimedAmount;
        require(withdrawal.adapterClaimed[adapter] <= withdrawal.adapterUndelegated[adapter], "adapter claimed amount exceed");

        if (withdrawal.totalClaimedAmount + withdrawal.totalSlashedAmount == withdrawal.totalAmountToClaim) {
            withdrawal.ableRedeem = true;
        }

        totalAmountToWithdraw -= slashedAmount;
        totalAmountRedeem += claimedAmount;
        totalAmountUndelegated -= withdrawal.adapterUndelegated[adapter];
    }

    function redeem(address receiver) external returns (uint256 amount) {
        for (uint256 i = 0; i < userEpoch[receiver].length; i++) {
            WithdrawalEpoch storage withdrawal = withdrawals[userEpoch[receiver][i]];
            if (!withdrawal.ableRedeem && withdrawal.userRedeemed[receiver]) {
                continue;
            }

            // todo: delete epoch from userEpoch ?
            withdrawal.userRedeemed[receiver] = true;
            amount += _getRedeemAmount(withdrawal, receiver);
        }

        totalAmountRedeem -= amount;
        totalAmountToWithdraw -= amount;
        return amount;
    }

    function _getRedeemAmount(WithdrawalEpoch storage withdrawal, address receiver) private view returns (uint256) {
        if (withdrawal.totalSlashedAmount == 0) {
            return withdrawal.userClaimAmount[receiver];
        }

        return withdrawal.userClaimAmount[receiver].mulDiv(
            withdrawal.totalAmountToClaim - withdrawal.totalSlashedAmount,
            withdrawal.totalAmountToClaim,
            Math.Rounding.Up
        );
    }
}
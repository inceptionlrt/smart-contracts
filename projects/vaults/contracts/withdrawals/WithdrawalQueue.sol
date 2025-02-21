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

    function request(address receiver, uint256 shares) external {
        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        withdrawal.totalRequestedShares += shares;
        withdrawal.userShares[receiver] += shares;

        addUserEpoch(receiver, epoch);
    }

    function addUserEpoch(address receiver, uint256 epochNum) private {
        uint256[] storage receiverEpochs = userEpoch[receiver];
        if (receiverEpochs.length == 0 || receiverEpochs[receiverEpochs.length - 1] != epochNum) {
            receiverEpochs.push(epochNum);
        }
    }

    function undelegate(address adapter, uint256 amount, uint256 shares) external returns (uint256) {
        uint256 undelegatedEpoch = epoch;

        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        withdrawal.adapterUndelegated[adapter] += amount;
        withdrawal.totalUndelegatedAmount += amount;
        withdrawal.totalUndelegatedShares += shares;
        withdrawal.adaptersUndelegatedCounter++;

        totalAmountUndelegated += amount;
        totalAmountToWithdraw += amount;

        if (withdrawal.totalUndelegatedShares == withdrawal.totalRequestedShares) {
            epoch++;
        }

        return undelegatedEpoch;
    }

    function claim(address adapter, uint256 epochNum, uint256 claimedAmount) external {
        WithdrawalEpoch storage withdrawal = withdrawals[epochNum];
        require(withdrawal.adapterUndelegated[adapter] > 0, "unknown adapter claim");

        withdrawal.totalClaimedAmount += claimedAmount;
        withdrawal.adaptersClaimedCounter++;

        totalAmountToWithdraw -= claimedAmount;
        totalAmountUndelegated -= withdrawal.adapterUndelegated[adapter];

        if (withdrawal.adaptersClaimedCounter == withdrawal.adaptersUndelegatedCounter) {
            withdrawal.ableRedeem = true;
        }
    }

    function redeem(address receiver) external returns (uint256 amount) {
        for (uint256 i = 0; i < userEpoch[receiver].length; i++) {
            WithdrawalEpoch storage withdrawal = withdrawals[userEpoch[receiver][i]];
            if (!withdrawal.ableRedeem || withdrawal.userRedeemed[receiver]) {
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
        return withdrawal.totalClaimedAmount.mulDiv(
            withdrawal.userShares[receiver],
            withdrawal.totalRequestedShares,
            Math.Rounding.Up
        );
    }
}
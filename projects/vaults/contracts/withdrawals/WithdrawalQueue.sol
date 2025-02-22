// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {IWithdrawalQueue} from "../interfaces/common/IWithdrawalQueue.sol";

contract WithdrawalQueue is IWithdrawalQueue {
    using Math for uint256;

    mapping(uint256 => WithdrawalEpoch) public withdrawals;
    mapping(address => uint256[]) internal userEpoch;

    uint256 public epoch;
    uint256 public totalAmountToWithdraw;
    uint256 public totalAmountUndelegated;
    uint256 public totalAmountRedeem;

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

    function undelegate(
        address adapter,
        uint256 shares,
        uint256 undelegatedAmount,
        uint256 claimedAmount
    ) external returns (uint256) {
        uint256 undelegatedEpoch = epoch;

        // update withdrawal data
        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        withdrawal.adapterUndelegated[adapter] += undelegatedAmount;
        withdrawal.totalUndelegatedAmount += undelegatedAmount;
        withdrawal.totalUndelegatedShares += shares;
        withdrawal.adaptersUndelegatedCounter++;

        require(withdrawal.totalUndelegatedShares <= withdrawal.totalRequestedShares, "undelegates shares exceed requested");

        // update global data
        totalAmountUndelegated += undelegatedAmount;
        totalAmountToWithdraw += undelegatedAmount;

        if (claimedAmount > 0) {
            withdrawal.totalClaimedAmount += claimedAmount;
            totalAmountRedeem += claimedAmount;
            totalAmountToWithdraw += claimedAmount;
        }

        _afterUndelegate(withdrawal);

        return undelegatedEpoch;
    }

    function _afterUndelegate(WithdrawalEpoch storage withdrawal) internal {
        if (withdrawal.totalUndelegatedShares == withdrawal.totalRequestedShares) {
            epoch++;
        }
    }

    function claim(address adapter, uint256 epochNum, uint256 claimedAmount) external {
        WithdrawalEpoch storage withdrawal = withdrawals[epochNum];
        require(withdrawal.adapterUndelegated[adapter] > 0, "unknown adapter claim");
        require(withdrawal.adapterClaimed[adapter] == 0, "adapter already claimed");

        // update withdrawal state
        withdrawal.totalClaimedAmount += claimedAmount;
        withdrawal.adaptersClaimedCounter++;

        // update global state
        totalAmountRedeem += claimedAmount;
        totalAmountToWithdraw -= withdrawal.adapterUndelegated[adapter] - claimedAmount; // difference means slash
        totalAmountUndelegated -= withdrawal.adapterUndelegated[adapter];

        _afterClaim(withdrawal);
    }

    function _afterClaim(WithdrawalEpoch storage withdrawal) internal {
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

    function _getRedeemAmount(WithdrawalEpoch storage withdrawal, address receiver) internal view returns (uint256) {
        return withdrawal.totalClaimedAmount.mulDiv(
            withdrawal.userShares[receiver],
            withdrawal.totalRequestedShares,
            Math.Rounding.Up
        );
    }
}
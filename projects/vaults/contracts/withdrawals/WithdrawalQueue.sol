// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {IWithdrawalQueue} from "../interfaces/common/IWithdrawalQueue.sol";

contract WithdrawalQueue is IWithdrawalQueue, PausableUpgradeable, ReentrancyGuardUpgradeable, Ownable2StepUpgradeable {
    using Math for uint256;

    address public vault;

    mapping(uint256 => WithdrawalEpoch) public withdrawals;
    mapping(address => uint256[]) internal userEpoch;

    uint256 public currentEpoch;
    uint256 public totalAmountToWithdraw;
    uint256 public totalAmountUndelegated;
    uint256 public totalAmountRedeem;

    function initialize(address _vault) external initializer {
        require(_vault != address(0), ValueZero());
        vault = _vault;
    }

    modifier onlyVault() {
        require(msg.sender == vault, OnlyVaultAllowed());
        _;
    }

    function request(address receiver, uint256 shares) external onlyVault {
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
        address[] calldata adapters,
        uint256[] calldata shares,
        uint256[] calldata undelegatedAmounts,
        uint256[] calldata claimedAmounts
    ) external onlyVault {
        WithdrawalEpoch storage withdrawal = withdrawals[currentEpoch];

        for (uint256 i = 0; i < adapters.length; i++) {
            _undelegate(
                withdrawal,
                adapters[i],
                shares[i],
                undelegatedAmounts[i],
                claimedAmounts[i]
            );
        }

        _afterUndelegate(withdrawal);
    }

    function _undelegate(
        WithdrawalEpoch storage withdrawal,
        address adapter,
        uint256 shares,
        uint256 undelegatedAmount,
        uint256 claimedAmount
    ) internal {
        require(shares > 0, ValueZero());
        require(withdrawal.totalUndelegatedShares + shares <= withdrawal.totalRequestedShares, UndelegateExceedRequested());

        // update withdrawal data
        withdrawal.adapterUndelegated[adapter] += undelegatedAmount;
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
        }
    }

    function _afterUndelegate(WithdrawalEpoch storage withdrawal) internal {
        require(withdrawal.totalRequestedShares == withdrawal.totalUndelegatedShares, UndelegateNotCompleted());
        currentEpoch++;
    }

    function claim(address adapter, uint256 epoch, uint256 claimedAmount) external onlyVault {
        WithdrawalEpoch storage withdrawal = withdrawals[epoch];
        require(withdrawal.adapterUndelegated[adapter] > 0, ClaimUnknownAdapter());
        require(withdrawal.adapterClaimed[adapter] == 0, AdapterAlreadyClaimed());
        require(withdrawal.adapterUndelegated[adapter] >= claimedAmount, ClaimedExceedUndelegated());

        // update withdrawal state
        withdrawal.adapterClaimed[adapter] += claimedAmount;
        withdrawal.totalClaimedAmount += claimedAmount;
        withdrawal.adaptersClaimedCounter++;

        // update global state
        totalAmountRedeem += claimedAmount;
        totalAmountToWithdraw -= withdrawal.adapterUndelegated[adapter] - claimedAmount; // difference means slash
        totalAmountUndelegated -= withdrawal.adapterUndelegated[adapter];

        _afterClaim(withdrawal);
    }

    function _afterClaim(WithdrawalEpoch storage withdrawal) internal {
        if (withdrawal.adaptersClaimedCounter == withdrawal.adaptersUndelegatedCounter) withdrawal.ableRedeem = true;
    }

    function redeem(address receiver) external onlyVault returns (uint256 amount) {
        for (uint256 i = 0; i < userEpoch[receiver].length; i++) {
            WithdrawalEpoch storage withdrawal = withdrawals[userEpoch[receiver][i]];
            if (!withdrawal.ableRedeem || withdrawal.userRedeemed[receiver]) {
                continue;
            }

            // todo: delete currentEpoch from userEpoch ?
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
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/math/Math.sol";

interface IWithdrawalQueue {
    struct WithdrawalEpoch {
        bool ableRedeem;

        uint256 totalAmountToClaim;
        uint256 totalUndelegatedAmount;
        uint256 totalClaimedAmount;
        uint256 totalSlashedAmount;

        mapping(address => uint256) adapterUndelegated;
        mapping(address => uint256) adapterClaimed;
        mapping(address => uint256) userClaimAmount;
        mapping(address => bool) userRedeemed;
    }

    function request(address receiver, uint256 amount) external;

    function undelegate(address adapter, uint256 undelegateAmount) external returns (uint256);

    function claim(address adapter, uint256 epochNum, uint256 claimedAmount) external;

    function redeem(address receiver) external returns (uint256 amount);

    function slashCurrentQueue(uint256 delegated, uint256 delegatedAfterSlash) external;

    function getWithdrawalUndelegateAmount(uint256 epochNum) external view returns (uint256);

    function getTotalAmountToWithdraw() external view returns (uint256);
}
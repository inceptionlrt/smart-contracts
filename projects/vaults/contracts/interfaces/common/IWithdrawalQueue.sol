// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IWithdrawalQueue {
    error UndelegateExceedRequested();
    error ClaimUnknownAdapter();
    error AdapterAlreadyClaimed();
    error ClaimedExceedUndelegated();
    error ValueZero();
    error OnlyVaultAllowed();

    struct WithdrawalEpoch {
        bool ableRedeem;

        uint256 totalRequestedShares;
        uint256 totalClaimedAmount;
        uint256 totalUndelegatedAmount;
        uint256 totalUndelegatedShares;

        mapping(address => bool) userRedeemed;
        mapping(address => uint256) userShares;
        mapping(address => uint256) adapterUndelegated;
        mapping(address => uint256) adapterClaimed;

        uint256 adaptersUndelegatedCounter;
        uint256 adaptersClaimedCounter;
    }

    function request(address receiver, uint256 shares) external;

    function undelegate(
        address adapter,
        uint256 shares,
        uint256 undelegatedAmount,
        uint256 claimedAmount
    ) external returns (uint256);

    function claim(address adapter, uint256 epochNum, uint256 claimedAmount) external;

    function redeem(address receiver) external returns (uint256 amount);

    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    function totalAmountToWithdraw() external view returns (uint256);

    function totalAmountUndelegated() external view returns (uint256);

    function totalAmountRedeem() external view returns (uint256);
}
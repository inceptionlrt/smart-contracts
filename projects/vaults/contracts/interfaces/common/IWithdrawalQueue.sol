// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IWithdrawalQueue {
    error UndelegateExceedRequested();
    error ClaimUnknownAdapter();
    error AdapterVaultAlreadyUndelegated();
    error AdapterAlreadyClaimed();
    error ClaimedExceedUndelegated();
    error UndelegateNotCompleted();
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
        mapping(address => mapping(address => uint256)) adapterUndelegated;
        mapping(address => mapping(address => uint256)) adapterClaimed;

        uint256 adaptersUndelegatedCounter;
        uint256 adaptersClaimedCounter;
    }

    function request(address receiver, uint256 shares) external;

    function undelegate(
        uint256 epoch,
        address[] calldata adapters,
        address[] calldata vaults,
        uint256[] calldata shares,
        uint256[] calldata undelegatedAmounts,
        uint256[] calldata claimedAmounts
    ) external;

    function undelegate(uint256 undelegatedAmount, uint256 claimedAmount) external;

    function claim(uint256 epochNum, address adapter, address vault, uint256 claimedAmount) external;

    function claim(uint256 claimedAmount) external;

    function redeem(address receiver) external returns (uint256 amount);

    /*//////////////////////////
    ////// GET functions //////
    ////////////////////////*/

    function currentEpoch() external view returns (uint256);

    function totalAmountToWithdraw() external view returns (uint256);

    function totalAmountUndelegated() external view returns (uint256);

    function totalAmountRedeem() external view returns (uint256);

    function getPendingWithdrawalOf(address receiver) external view returns (uint256 amount);

    function ableToRedeem(address claimer) external view returns (bool able, uint256[] memory withdrawalIndexes);
}
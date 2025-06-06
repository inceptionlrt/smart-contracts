// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWithdrawalQueueERC721 {
    struct WithdrawalRequestStatus {
        uint256 amountOfStETH;
        uint256 amountOfShares;
        address owner;
        uint256 timestamp;
        bool isFinalized;
        bool isClaimed;
    }

    function getWithdrawalRequests(address _owner) external view returns (uint256[] memory requestsIds);

    function requestWithdrawalsWstETH(uint256[] calldata _amounts, address _owner) external returns (uint256[] memory requestIds);

    function getWithdrawalStatus(uint256[] calldata _requestIds) external view returns (WithdrawalRequestStatus[] memory statuses);

    function claimWithdrawal(uint256 _requestId) external;
}
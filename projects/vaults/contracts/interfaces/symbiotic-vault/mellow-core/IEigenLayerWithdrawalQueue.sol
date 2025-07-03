// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IEigenLayerWithdrawalQueue {
    // struct WithdrawalData {
    //     IDelegationManager.Withdrawal data;
    //     bool isClaimed;
    //     uint256 assets;
    //     uint256 shares;
    //     mapping(address account => uint256) sharesOf;
    // }

    // struct AccountData {
    //     uint256 claimableAssets;
    //     EnumerableSet.UintSet withdrawals;
    //     EnumerableSet.UintSet transferredWithdrawals;
    // }

    function MAX_WITHDRAWALS() external view returns (uint256);

    function isolatedVault() external view returns (address);

    function claimer() external view returns (address);

    function delegation() external view returns (address);

    function strategy() external view returns (address);

    function operator() external view returns (address);

    function isShutdown() external view returns (bool);

    function latestWithdrawableBlock() external view returns (uint256);

    function getAccountData(
        address account,
        uint256 withdrawalsLimit,
        uint256 withdrawalsOffset,
        uint256 transferredWithdrawalsLimit,
        uint256 transferredWithdrawalsOffset
    )
        external
        view
        returns (
            uint256 claimableAssets,
            uint256[] memory withdrawals,
            uint256[] memory transferredWithdrawals
        );

    function withdrawalRequests() external view returns (uint256);

    function request(
        address account,
        uint256 assets,
        bool isSelfRequested
    ) external;

    function handleWithdrawals(address account) external;

    function acceptPendingAssets(
        address account,
        uint256[] calldata withdrawals_
    ) external;

    // permissionless function
    function shutdown(uint32 blockNumber, uint256 shares) external;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed withdrawalIndex,
        uint256 assets
    );

    event Pull(uint256 indexed withdrawalIndex, uint256 assets);

    event Handled(
        address indexed account,
        uint256 indexed withdrawalIndex,
        uint256 assets
    );

    event Request(
        address indexed account,
        uint256 indexed withdrawalIndex,
        uint256 assets,
        bool isSelfRequested
    );

    event Claimed(address indexed account, address indexed to, uint256 assets);

    event Accepted(address indexed account, uint256 indexed withdrawalIndex);

    event Shutdown(
        address indexed sender,
        uint32 indexed blockNumber,
        uint256 indexed shares
    );
}


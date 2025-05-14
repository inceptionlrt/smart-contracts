// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IInceptionBaseAdapter {
    /************************************
     ************** Errors **************
     ************************************/

    error ValueZero();

    error TransferAssetFailed(address assetAddress);

    error InconsistentData();

    error WrongClaimWithdrawalParams();

    error NullParams();

    error NotVaultOrTrusteeManager();

    error LengthMismatch();

    error InvalidVault();

    error ZeroAddress();

    error AlreadyAdded();

    error NotContract();

    error NotAdded();

    error InvalidDataLength(uint256 expected, uint256 received);

    error OnlyEmergency();

    /************************************
     ************** Events **************
     ************************************/

    event InceptionVaultSet(address indexed oldVault, address indexed newVault);

    event TrusteeManagerSet(
        address indexed _trusteeManager,
        address indexed _newTrusteeManager
    );

    event EmergencyClaimerSet(address indexed oldClaimer, address indexed newClaimer);

    function pendingWithdrawalAmount() external view returns (uint256);

    function getDeposited(address vaultAddress) external view returns (uint256);

    function getTotalDeposited() external view returns (uint256);

    function claimableAmount() external view returns (uint256);

    function inactiveBalance() external view returns (uint256);

    function inactiveBalanceEmergency() external view returns (uint256);

    function delegate(
        address vault,
        uint256 amount,
        bytes[] calldata _data
    ) external returns (uint256 depositedAmount);

    function withdraw(
        address vault,
        uint256 amount,
        bytes[] calldata _data,
        bool emergency
    ) external returns (uint256 undelegated, uint256 claimed);

    function claim(bytes[] calldata _data, bool emergency) external returns (uint256);

    function claimFreeBalance() external;

    function claimRewards(address rewardToken, bytes memory rewardData) external;
}

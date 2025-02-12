// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICumulativeMerkleDrop {
    /// @notice error emitted when address is null.
    error ADDRESS_NULL();

    /// @notice error emitted when claim is closed.
    error CLAIM_CLOSED();

    /// @notice error emitted when amount to lock is greater than claimable amount.
    error AMOUNT_TO_LOCK_GT_AMOUNT_CLAIMED();

    /// @notice error emitted when submited proof is invalid.
    error INVALID_PROOF();

    /// @notice error emitted when claim status is invalid.
    error INVALID_STATUS();

    /// @notice error emitted when nothing to claim.
    error NOTHING_TO_CLAIM();

    /// @notice error emitted when an admin tries to update the merkle root with the same value.
    error SAME_MERKLE_ROOT();

    /// @notice error emitted when an admin tries to update the staking contract to the same address.
    error SAME_STAKING_CONTRACT();

    /// @notice error emitted when the provided staking contract token address does not match the drop token address.
    error STAKING_TOKEN_MISMATCH();

    /// @notice error emitted when staking is set to the zero address and the user attempts to lock funds.
    error STAKING_NOT_AVAILABLE();

    /// @notice event emitted when claim is made.
    /// @param account The account that made the claim.
    /// @param amount The amount of token claimed.
    /// @param amountToLock The amount of token locked.
    event Claimed(address indexed account, uint256 amount, uint256 amountToLock);

    /// @notice event emitted when claim status is updated.
    /// @param oldStatus The old status of the claim.
    /// @param newStatus The new status of the claim.
    event ClaimStatusUpdated(uint8 oldStatus, uint8 newStatus);

    /// @notice event emitted when Merkle root is updated.
    /// @param oldMerkleRoot The old Merkle root.
    /// @param newMerkleRoot The new Merkle root.
    event MerkleRootUpdated(bytes32 oldMerkleRoot, bytes32 newMerkleRoot);

    /// @notice event emitted when stakingContract contract is updated.
    /// @param oldStakingContract The old stakingContract contract address.
    /// @param newStakingContract The new stakingContract contract address.
    event StakingContractUpdated(address oldStakingContract, address newStakingContract);

    /// @notice event emitted when stakingContract contract is cleared.
    event StakingContractCleared();

    /// @notice Claim and lock token.
    /// @param cumulativeAmount The cumulative amount of token claimed.
    /// @param amountToLock The amount of token to lock.
    /// @param merkleProof The merkle proof.
    /// @notice It is only possible to lock if there is a staking contract set.
    function claimAndLock(uint256 cumulativeAmount, uint256 amountToLock, bytes32[] memory merkleProof) external;

    /// @notice Get the status of the claim.
    /// @return The status of the claim, 1 for open, 2 for closed.
    function claimIsOpen() external view returns (uint8);

    /// @notice Get the cumulative claimed amount of an account.
    /// @return The cumulative claimed amount of an account.
    function cumulativeClaimed(address) external view returns (uint256);

    /// @notice Get the current Merkle root.
    /// @return The current Merkle root.
    function merkleRoot() external view returns (bytes32);

    /// @notice Set the status of the claim.
    /// @param status The status of the claim, 1 for open, 2 for closed.
    function setClaimStatus(uint8 status) external;

    /// @notice Set the Merkle root.
    /// @param _merkleRoot The new Merkle root.
    function setMerkleRoot(bytes32 _merkleRoot) external;

    /// @notice Set the staking contract address.
    /// @param _stakingContract The staking contract address.
    function setStakingContract(address _stakingContract) external;

    /// @notice Clear the staking contract address.
    /// @notice After calling, it is not possible to lock funds until a new staking contract is set.
    function clearStakingContract() external;

    /// @notice Get the token address.
    /// @return The token address.
    function token() external view returns (IERC20);

    /// @notice Verify the merkle proof.
    /// @param proof The merkle proof.
    /// @param amount The amount of token claimed.
    /// @param addr The address of the claimer.
    /// @return True if the proof is valid, false otherwise.
    function verifyProof(bytes32[] memory proof, uint256 amount, address addr) external view returns (bool);
}
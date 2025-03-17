// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEmergencyClaimer {
    /**
     * @notice Claims funds from a Symbiotic vault for a specific epoch.
     * @dev Can only be called by the symbiotic adapter.
     * @param vault The address of the Symbiotic vault to claim from.
     * @param recipient The address to receive the claimed funds.
     * @param epoch The epoch for which the claim is being made.
     * @return The amount of funds claimed.
     */
    function claimSymbiotic(address vault, address recipient, uint256 epoch) external returns (uint256);

    /**
     * @notice Claims funds from a Mellow Symbiotic vault.
     * @dev Can only be called by the mellow adapter.
     * @param vault The address of the Mellow Symbiotic vault to claim from.
     * @param recipient The address to receive the claimed funds.
     * @param amount The amount of funds to claim.
     * @return The amount of funds claimed.
     */
    function claimMellow(address vault, address recipient, uint256 amount) external returns (uint256);
}
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "../../../interfaces/common/ICumulativeMerkleDrop.sol";

import "../InceptionVaultStorage_EL.sol";

/**
 * @title The SwellAirDropFacet contract
 * @author The InceptionLRT team
 */
contract SwellAirDropFacet is InceptionVaultStorage_EL {
    address immutable SWELL_AIDROP_CONTRACT =
        address(0x342F0D375Ba986A65204750A4AECE3b39f739d75);

    event AirDropClaimed(address sender, address receiver, uint256 amount);

    constructor() payable {}

    function claimAidrop(
        uint256 cumulativeAmount,
        bytes32[] calldata merkleProof
    ) external {
        uint256 initBalance = _asset.balanceOf(address(this));
        ICumulativeMerkleDrop(SWELL_AIDROP_CONTRACT).claimAndLock(
            cumulativeAmount,
            0,
            merkleProof
        );

        if (initBalance + cumulativeAmount != _asset.balanceOf(address(this))) {
            revert();
        }

        _transferAssetTo(owner(), cumulativeAmount);

        emit AirDropClaimed(_msgSender(), owner(), cumulativeAmount);
    }
}

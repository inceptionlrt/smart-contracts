// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ICrossChainBridgeL1} from "../interfaces/ICrossChainBridgeL1.sol";
import {AbstractCrossChainAdapter} from "./AbstractCrossChainAdapter.sol";
import {IRebalancer} from "../interfaces/IRebalancer.sol";

/**
 * @title AbstractCrossChainAdapter
 * @author InceptionLRT
 * @dev This abstract contract extends `AbstractCrossChainAdapter` with functionality specific to receiving
 * cross-chain data from Layer 2 to Layer 1. It decodes and processes data from incoming cross-chain messages,
 * updating the designated `targetReceiver` with timestamped balance and supply information.
 * Intended for use by Layer 1 cross-chain bridge adapters.
 */
abstract contract AbstractCrossChainAdapterL1 is
    AbstractCrossChainAdapter,
    ICrossChainBridgeL1
{
    function _handleCrossChainData(
        uint256 _chainId,
        bytes calldata _payload
    ) internal {
        require(targetReceiver != address(0), TargetReceiverNotSet());
        (
            uint256 timestamp,
            uint256 totalSupply,
            uint256 balance
        ) = _decodeCalldata(_payload);
        IRebalancer(targetReceiver).handleL2Info(
            _chainId,
            timestamp,
            balance,
            totalSupply
        );
        emit CrossChainInfoReceived(_chainId, timestamp, balance, totalSupply);
    }

    function _decodeCalldata(
        bytes calldata payload
    ) internal pure returns (uint256, uint256, uint256) {
        (uint256 timestamp, uint256 balance, uint256 totalSupply) = abi.decode(
            payload,
            (uint256, uint256, uint256)
        );
        return (timestamp, balance, totalSupply);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "../interfaces/ICrossChainBridgeL1.sol";
import "../interfaces/IRebalancer.sol";
import "./AbstractCrossChainAdapter.sol";

abstract contract AbstractCrossChainAdapterL1 is AbstractCrossChainAdapter, ICrossChainBridgeL1 {
    function _handleCrossChainData(uint256 _chainId, bytes calldata _payload) internal {
        require(vault != address(0), VaultNotSet());
        (uint256 timestamp, uint256 balance, uint256 totalSupply) = _decodeCalldata(_payload);
        if (timestamp > block.timestamp) {
            revert FutureTimestamp();
        }
        IRebalancer(vault).handleL2Info(_chainId, timestamp, balance, totalSupply);
        emit CrossChainInfoReceived(_chainId, timestamp, balance, totalSupply);
    }

    function _decodeCalldata(bytes calldata payload) internal pure returns (uint256, uint256, uint256) {
        (uint256 timestamp, uint256 balance, uint256 totalSupply) = abi.decode(payload, (uint256, uint256, uint256));
        return (timestamp, balance, totalSupply);
    }
}

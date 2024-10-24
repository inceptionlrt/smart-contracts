// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface ICrossChainBridgeL2 {
    // ======================= Events =======================
    event CrossChainMessageReceived(uint256 indexed chainId, uint256 value, bytes data);
    event CrossChainMessageSent(uint256 indexed chainId, uint256 value, bytes data, uint256 fee);

    // ======================= Functions =======================
    function quote(uint256 chainId, bytes calldata _payload, bytes memory _options) external view returns (uint256);

    function sendDataL1(bytes calldata _payload, bytes memory _options) external;
}

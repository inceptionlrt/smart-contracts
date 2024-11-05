// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICrossChainAdapter {
    event QuoteSuccess(uint256 indexed chainId);
    event QuoteError(uint256 indexed chainId, string reason);
    event QuoteErrorLowLevel(uint256 indexed chainId, bytes lowLevelError);

    function receiveCrosschainEth(uint256 _chainId) external payable;

    function handleCrossChainData(
        uint256 _chainId,
        bytes calldata _payload
    ) external;
}

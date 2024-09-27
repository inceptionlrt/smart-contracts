// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "./AbstractCrossChainAdapterL2.sol";

contract CrossChainAdapterArbitrumL2 is AbstractCrossChainAdapterL2 {
    ArbSys constant arbsys = ArbSys(address(100));

    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount
    ) external override returns (bool success) {
        bytes memory data = abi.encodeWithSignature(
            "receiveAssetsInfo(uint256,uint256)",
            tokensAmount,
            ethAmount
        );

        uint256 withdrawalId = arbsys.sendTxToL1(l1Target, data);

        emit AssetsInfoSentToL1(tokensAmount, ethAmount, withdrawalId);
        return true;
    }

    function sendEthToL1(
        uint256 _callValue
    ) external payable override onlyVault returns (bool success) {
        require(_callValue <= msg.value, InsufficientValueSent());
        uint256 withdrawalId = arbsys.withdrawEth{value: msg.value}(l1Target);

        emit EthSentToL1(msg.value, withdrawalId);
        return true;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import { Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

import { AbstractLZCrossChainAdapter } from "./abstract/AbstractLZCrossChainAdapter.sol";
import { AbstractCrossChainAdapterL1 } from "./abstract/AbstractCrossChainAdapterL1.sol";
import { OAppReceiverUpgradeable } from "./OAppReceiverUpgradeable.sol";

contract LZCrossChainAdapterL1 is AbstractLZCrossChainAdapter, AbstractCrossChainAdapterL1 {
    function initialize(
        address _endpoint,
        address _delegate,
        uint32[] memory _eIds,
        uint256[] memory _chainIds
    ) public initializer {
        __Ownable_init(msg.sender);
        __OAppUpgradeable_init(_endpoint, _delegate);

        require(_eIds.length == _chainIds.length, ArraysLengthsMismatch());

        for (uint256 i = 0; i < _eIds.length; i++) {
            setChainIdFromEid(_eIds[i], _chainIds[i]);
        }
    }

    function _lzReceive(
        Origin calldata origin,
        bytes32 /*_guid*/,
        bytes calldata payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal virtual override(OAppReceiverUpgradeable) {
        uint256 chainId = getChainIdFromEid(origin.srcEid);

        if (msg.value > 0) {
            _handleCrossChainEth(chainId);
        }

        if (payload.length > 0) {
            _handleCrossChainData(chainId, payload);
        }
    }
}

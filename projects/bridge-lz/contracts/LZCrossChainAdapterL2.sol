// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import { AbstractLZCrossChainAdapter } from "./abstract/AbstractLZCrossChainAdapter.sol";
import { AbstractCrossChainAdapterL2 } from "./abstract/AbstractCrossChainAdapterL2.sol";

contract LZCrossChainAdapterL2 is AbstractLZCrossChainAdapter, AbstractCrossChainAdapterL2 {
    uint256 private l1ChainId;

    function initialize(
        address _endpoint,
        address _delegate,
        uint256 _l1ChainId,
        uint32[] memory _eIds,
        uint256[] memory _chainIds
    ) public initializer {
        __Ownable_init(msg.sender);
        __OAppUpgradeable_init(_endpoint, _delegate);
        require(_eIds.length == _chainIds.length, ArraysLengthsMismatch());
        l1ChainId = _l1ChainId;

        for (uint256 i = 0; i < _eIds.length; i++) {
            setChainIdFromEid(_eIds[i], _chainIds[i]);
        }
    }

    function quote(
        uint256 _chainId,
        bytes calldata _payload,
        bytes memory _options
    ) public view onlyOwner returns (uint256) {
        return _quote(_chainId, _payload, _options);
    }

    function sendDataL1(bytes calldata _payload, bytes memory _options) external {
        _sendCrosschain(l1ChainId, _payload, _options);
    }
}

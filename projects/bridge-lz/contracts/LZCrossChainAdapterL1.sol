// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "./abstract/AbstractLZCrossChainAdapter.sol";

contract LZCrossChainAdapterL1 is AbstractLZCrossChainAdapter {
    uint256 private l1ChainId;

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

}

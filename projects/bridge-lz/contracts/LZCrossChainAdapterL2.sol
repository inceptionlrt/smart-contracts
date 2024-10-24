// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "./abstract/AbstractLZCrossChainAdapter.sol";
import "./abstract/AbstractCrossChainAdapterL2.sol";

contract LZCrossChainAdapterL2 is AbstractLZCrossChainAdapter {
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

    function quote(
        uint256 _chainId,
        bytes calldata _payload,
        bytes memory _options,
        bool _payInLzToken
    ) public view onlyOwner returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        if (dstEid == 0) revert NoDestEidFoundForChainId(_chainId);
        MessagingFee memory fee = _quote(dstEid, _payload, _options, _payInLzToken);
        return fee.nativeFee;
    }

    function sendDataL1(bytes calldata _payload, bytes memory _options) external {
        _sendCrosschain(l1ChainId, _payload, _options);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {AbstractLZCrossChainAdapter} from "../abstract/AbstractLZCrossChainAdapter.sol";
import {AbstractCrossChainAdapterL2} from "../abstract/AbstractCrossChainAdapterL2.sol";
import {AbstractCrossChainAdapter} from "../abstract/AbstractCrossChainAdapter.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

import {Origin} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

/**
 * @title LZCrossChainAdapterL2
 * @dev Layer 2 adapter for LayerZero cross-chain communication, supporting ETH transfers and data messaging with Layer 1.
 * This contract manages endpoint and chain ID mappings, enables quoting for cross-chain transactions, and provides functions for
 * data transfer to L1.
 */

contract LZCrossChainAdapterL2 is
    AbstractLZCrossChainAdapter,
    AbstractCrossChainAdapterL2,
    Initializable,
    Ownable2StepUpgradeable
{
    modifier onlyOwnerRestricted()
        override(AbstractCrossChainAdapter, AbstractLZCrossChainAdapter) {
        _checkOwner();
        _;
    }

    modifier onlyTargetReceiverRestricted() override {
        require(
            msg.sender == targetReceiver || msg.sender == owner(),
            NotTargetReceiver(msg.sender)
        );
        _;
    }

    uint32 private l1ChainId;

    function initialize(
        address _endpoint,
        address _delegate,
        uint32 _l1ChainId,
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

    function quote(bytes calldata _payload, bytes memory _options)
        external
        view
        override
        returns (uint256)
    {
        return _quote(l1ChainId, _payload, _options);
    }

    function sendDataL1(bytes calldata _payload, bytes memory _options)
        external
        payable
        override
        onlyTargetReceiverRestricted
        returns (uint256)
    {
        return _sendCrosschain(l1ChainId, _payload, _options);
    }

    function _lzReceive(
        Origin calldata origin,
        bytes32, /*_guid*/
        bytes calldata,
        address, /*_executor*/
        bytes calldata /*_extraData*/
    ) internal virtual override {
        uint256 chainId = getChainIdFromEid(origin.srcEid);

        if (msg.value > 0) {
            _handleCrossChainEth(chainId);
        }
    }
}
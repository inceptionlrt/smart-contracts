// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Origin} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {AbstractCrossChainAdapter} from "./abstract/AbstractCrossChainAdapter.sol";
import {AbstractLZCrossChainAdapter} from "./abstract/AbstractLZCrossChainAdapter.sol";
import {AbstractCrossChainAdapterL1} from "./abstract/AbstractCrossChainAdapterL1.sol";
import {OAppReceiverUpgradeable} from "./OAppReceiverUpgradeable.sol";

/**
 * @title LZCrossChainAdapterL1
 * @dev Layer 1 adapter for cross-chain messaging using LayerZero's communication framework.
 * This contract initializes mappings between Endpoint IDs (EIDs) and chain IDs  and processes
 * incoming messages with optional ETH transfers and payload handling. Extends LayerZero and
 * cross-chain adapter functionalities for L1 environments.
 */
contract LZCrossChainAdapterL1 is
    AbstractLZCrossChainAdapter,
    AbstractCrossChainAdapterL1,
    Initializable,
    OwnableUpgradeable
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

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Origin, MessagingReceipt, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {AbstractCrossChainAdapter} from "../abstract/AbstractCrossChainAdapter.sol";
import {ICrossChainBridge} from "../interfaces/ICrossChainBridge.sol";
import {OAppUpgradeable} from "../OAppUpgradeable.sol";

/**
 * @title AbstractLZCrossChainAdapter
 * @dev Provides foundational cross-chain messaging functionality using LayerZero's messaging protocols.
 * This contract includes methods to send and quote cross-chain ETH transactions, map LayerZero Endpoint IDs (EIDs)
 * to chain IDs, and configure peer contracts for cross-chain interaction. It is intended to be inherited by specific
 * cross-chain adapter implementations.
 */
abstract contract AbstractLZCrossChainAdapter is
    ICrossChainBridge,
    OAppUpgradeable
{
    error NoDestEidFoundForChainId(uint32 chainId);
    error NoChainIdForEid(uint32 eid);
    error ArraysLengthsMismatch();

    mapping(uint32 => uint32) public eidToChainId;
    mapping(uint32 => uint32) public chainIdToEid;

    modifier onlyOwnerRestricted() virtual;
    modifier onlyTargetReceiverRestricted() virtual;

    function sendEthCrossChain(
        uint32 _chainId,
        bytes memory _options
    ) external payable override onlyTargetReceiverRestricted {
        _sendCrosschain(_chainId, new bytes(0), _options);
    }

    function _quote(
        uint32 _chainId,
        bytes calldata _payload,
        bytes memory _options
    ) internal view returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        if (dstEid == 0) revert NoDestEidFoundForChainId(_chainId);
        MessagingFee memory fee = _quote(dstEid, _payload, _options, false);
        return fee.nativeFee;
    }

    function quoteSendEth(
        uint32 _chainId,
        bytes memory _options
    ) external view override returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        if (dstEid == 0) revert NoDestEidFoundForChainId(_chainId);

        bytes memory emptyPayload = "";
        MessagingFee memory fee = _quote(dstEid, emptyPayload, _options, false);
        return fee.nativeFee;
    }

    function setChainIdFromEid(
        uint32 _eid,
        uint32 _chainId
    ) public onlyOwnerRestricted {
        eidToChainId[_eid] = _chainId;
        chainIdToEid[_chainId] = _eid;
        emit ChainIdAdded(_chainId, _eid);
    }

    function deleteChainIdAndEid(
        uint32 _eid,
        uint32 _chainId
    ) public onlyOwnerRestricted {
        delete eidToChainId[_eid];
        delete chainIdToEid[_chainId];
        emit ChainIdAndEidDeleted(_chainId, _eid);
    }

    function getChainIdFromEid(
        uint32 _eid
    ) public view returns (uint32 chainId) {
        chainId = eidToChainId[_eid];
        if (chainId == 0) revert NoChainIdForEid(_eid);
        return chainId;
    }

    function getEidFromChainId(
        uint32 _chainId
    ) public view returns (uint32 eid) {
        eid = chainIdToEid[_chainId];
        if (eid == 0) revert NoDestEidFoundForChainId(_chainId);
        return eid;
    }

    function setPeer(
        uint32 _eid,
        bytes32 _peer
    ) public override onlyOwnerRestricted {
        _setPeer(_eid, _peer);
    }

    function _sendCrosschain(
        uint32 _chainId,
        bytes memory _payload,
        bytes memory _options
    ) internal {
        uint32 dstEid = getEidFromChainId(_chainId);
        MessagingReceipt memory receipt = _lzSend(
            dstEid,
            _payload,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );

        uint256 fee = receipt.fee.nativeFee;
        emit CrossChainMessageSent(_chainId, msg.value, _payload, fee);
    }
}

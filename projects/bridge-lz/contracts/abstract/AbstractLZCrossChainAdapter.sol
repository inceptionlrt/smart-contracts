// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "../OAppUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/ICrossChainBridgeL2.sol";
import "../abstract/AbstractCrossChainAdapterL1.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract AbstractLZCrossChainAdapter is
    ICrossChainBridge,
    OAppUpgradeable,
    AbstractCrossChainAdapterL1,
    Initializable,
    OwnableUpgradeable
{
    event CrossChainMessageSent(uint256 _chainId, uint256 value, bytes _payload, uint256 fee);

    error NoDestEidFoundForChainId(uint256 chainId);
    error ArraysLengthsMismatch();

    mapping(uint32 => uint256) public eidToChainId;
    mapping(uint256 => uint32) public chainIdToEid;

    // Implement LayerZero specific logic here
    function _lzReceive(
        Origin calldata origin,
        bytes32 /*_guid*/,
        bytes calldata payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        uint256 chainId = getChainIdFromEid(origin.srcEid);

        if (msg.value > 0) {
            _handleCrossChainEth(chainId);
        }

        if (payload.length > 0) {
            _handleCrossChainData(chainId, payload);
        }
    }

    function _sendCrosschain(uint256 _chainId, bytes memory _payload, bytes memory _options) internal {
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

    function sendEthCrossChain(uint256 _chainId) external payable override onlyVault {
        _sendCrosschain(_chainId, new bytes(0), new bytes(0));
    }

    function _quote(uint256 _chainId, bytes calldata _payload, bytes memory _options) internal view returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        if (dstEid == 0) revert NoDestEidFoundForChainId(_chainId);
        MessagingFee memory fee = _quote(dstEid, _payload, _options, false);
        return fee.nativeFee;
    }

    function quoteSendEth(uint256 _chainId) external view override returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        if (dstEid == 0) revert NoDestEidFoundForChainId(_chainId);

        bytes memory emptyPayload = "";
        bytes memory emptyOptions = "";
        MessagingFee memory fee = _quote(dstEid, emptyPayload, emptyOptions, false);
        return fee.nativeFee;
    }

    function setChainIdFromEid(uint32 _eid, uint256 _chainId) public onlyOwner {
        eidToChainId[_eid] = _chainId;
        chainIdToEid[_chainId] = _eid;
        emit ChainIdAdded(_chainId);
    }

    function getChainIdFromEid(uint32 _eid) public view returns (uint256) {
        return eidToChainId[_eid];
    }

    function getEidFromChainId(uint256 _chainId) public view returns (uint32) {
        return chainIdToEid[_chainId];
    }
}
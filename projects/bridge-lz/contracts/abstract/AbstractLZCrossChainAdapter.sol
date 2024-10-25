// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { Origin, MessagingReceipt, MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

import { AbstractCrossChainAdapter } from "../abstract/AbstractCrossChainAdapter.sol";
import { ICrossChainBridge } from "../interfaces/ICrossChainBridge.sol";

abstract contract AbstractLZCrossChainAdapter is ICrossChainBridge, AbstractCrossChainAdapter {
    error NoDestEidFoundForChainId(uint256 chainId);
    error ArraysLengthsMismatch();

    mapping(uint32 => uint256) public eidToChainId;
    mapping(uint256 => uint32) public chainIdToEid;

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

    function _lzReceive(
        Origin calldata origin,
        bytes32 /*_guid*/,
        bytes calldata,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal virtual override {
        uint256 chainId = getChainIdFromEid(origin.srcEid);

        if (msg.value > 0) {
            _handleCrossChainEth(chainId);
        }
    }
}

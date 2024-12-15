// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Origin, MessagingReceipt, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {OptionsBuilder} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";

import {AbstractCrossChainAdapter} from "./AbstractCrossChainAdapter.sol";
import {IAdapter} from "../interfaces/IAdapter.sol";
import {OAppUpgradeable} from "../LayerZero/OAppUpgradeable.sol";

/**
 * @title AbstractLZCrossChainAdapter
 * @dev Provides foundational cross-chain messaging functionality using LayerZero's messaging protocols.
 * This contract includes methods to send and quote cross-chain ETH transactions, map LayerZero Endpoint IDs (EIDs)
 * to chain IDs, and configure peer contracts for cross-chain interaction. It is intended to be inherited by specific
 * cross-chain adapter implementations.
 */
abstract contract AbstractLZCrossChainAdapter is IAdapter, OAppUpgradeable {
    using OptionsBuilder for bytes;

    error NoDestEidFoundForChainId(uint256 chainId);
    error ArraysLengthsMismatch();
    error OptionsTooShort();

    mapping(uint32 => uint256) public eidToChainId;
    mapping(uint256 => uint32) public chainIdToEid;

    modifier onlyOwnerRestricted() virtual;
    modifier onlyTargetReceiverRestricted() virtual;

    function sendEthCrossChain(uint256 _chainId, bytes memory _options)
        external
        payable
        override
        onlyTargetReceiverRestricted
        returns (uint256)
    {
        return _sendCrosschain(_chainId, new bytes(0), _options);
    }

    function _quote(
        uint256 _chainId,
        bytes calldata _payload,
        bytes memory _options
    ) internal view returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        if (dstEid == 0) revert NoDestEidFoundForChainId(_chainId);
        MessagingFee memory fee = _quote(dstEid, _payload, _options, false);
        return fee.nativeFee;
    }

    function quoteSendEth(uint256 _chainId, bytes memory _options)
        external
        view
        override
        returns (uint256)
    {
        uint32 dstEid = getEidFromChainId(_chainId);
        if (dstEid == 0) revert NoDestEidFoundForChainId(_chainId);

        bytes memory emptyPayload = "";
        MessagingFee memory fee = _quote(dstEid, emptyPayload, _options, false);
        return fee.nativeFee;
    }

    function setChainIdFromEid(uint32 _eid, uint256 _chainId)
        public
        onlyOwnerRestricted
    {
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

    function setPeer(uint32 _eid, bytes32 _peer)
        public
        override
        onlyOwnerRestricted
    {
        _setPeer(_eid, _peer);
    }

    function _sendCrosschain(
        uint256 _chainId,
        bytes memory _payload,
        bytes memory _options
    ) internal returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        MessagingReceipt memory receipt = _lzSend(
            dstEid,
            _payload,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );

        uint256 fee = receipt.fee.nativeFee - this.getValueFromOpts(_options);
        emit CrossChainMessageSent(
            _chainId,
            this.getValueFromOpts(_options),
            _payload,
            fee
        );

        return fee;
    }

    function getValueFromOpts(bytes calldata _options)
        public
        pure
        override
        returns (uint256)
    {
        require(_options.length >= 16, OptionsTooShort());
        if (_options.length <= 32) {
            return 0;
        }
        uint256 valueStart = _options.length - 16;
        uint256 valueEnd = _options.length;
        return uint256(uint128(bytes16(_options[valueStart:valueEnd])));
    }

    /// @notice Creates options for executing `lzReceive` on the destination chain.
    /// @param _gas The gas amount for the `lzReceive` execution.
    /// @param _value The msg.value for the `lzReceive` execution.
    /// @return bytes-encoded option set for `lzReceive` executor.
    function createLzReceiveOption(uint256 _gas, uint256 _value)
        public
        pure
        returns (bytes memory)
    {
        return
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(
                uint128(_gas),
                uint128(_value)
            );
    }
}

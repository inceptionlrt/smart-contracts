// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { MessagingReceipt } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import { ICrossChainBridge } from "./interfaces/ICrossChainBridge.sol";
import { ICrossChainAdapter } from "./interfaces/ICrossChainAdapter.sol";

contract LZCrossChainBridge is ICrossChainBridge, OApp {
    constructor(
        address _endpoint,
        address _delegate,
        uint32[] memory _eIds,
        uint256[] memory _chainIds
    ) OApp(_endpoint, _delegate) Ownable(_delegate) {
        require(_eIds.length == _chainIds.length, ArraysLengthsMismatch());

        for (uint256 i = 0; i < _eIds.length; i++) {
            setChainIdFromEid(_eIds[i], _chainIds[i]);
        }
    }

    address public adapter;
    mapping(uint32 => uint256) public eidToChainId;
    mapping(uint256 => uint32) public chainIdToEid;

    /**
     * @notice Sends a message from the source chain to a destination chain.
     * @param _chainId The chain ID of the destination.
     * @param _payload The byte data to be sent.
     * @param _options Additional options for message execution.
     * @dev Encodes the message as bytes and sends it using the `_lzSend` internal function.
     */
    function sendCrosschain(
        uint256 _chainId,
        bytes calldata _payload,
        bytes calldata _options
    ) external payable override {
        if (msg.sender != owner() && msg.sender != adapter) {
            revert Unauthorized(msg.sender);
        }

        if (adapter == address(0)) {
            revert NoAdapterSet();
        }

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

    /**
     * @notice Quotes the gas needed to pay for the full omnichain transaction in native gas or ZRO token.
     * @param _chainId Destination chain ID.
     * @param _payload The byte data to be sent.
     * @param _options Message execution options (e.g., for sending gas to destination).
     * @param _payInLzToken Whether to return fee in ZRO token.
     * @return fee A `MessagingFee` struct containing the calculated gas fee in either the native token or ZRO token.
     */
    function quote(
        uint256 _chainId,
        bytes calldata _payload,
        bytes memory _options,
        bool _payInLzToken
    ) public view override onlyOwner returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        if (dstEid == 0) revert NoDestEidFoundForChainId(_chainId);
        MessagingFee memory fee = _quote(dstEid, _payload, _options, _payInLzToken);
        return fee.nativeFee;
    }

    /**
     * @notice Quote the fee required to send ETH cross-chain.
     * @param _chainId The chain ID of the destination chain.
     * @return fee The estimated fee to send ETH cross-chain.
     */
    function quoteSendEth(uint256 _chainId) external view override returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        if (dstEid == 0) revert NoDestEidFoundForChainId(_chainId);

        // Since we're just sending ETH, payload and options can be empty
        bytes memory emptyPayload = "";
        bytes memory emptyOptions = "";

        MessagingFee memory fee = _quote(dstEid, emptyPayload, emptyOptions, false);
        return fee.nativeFee;
    }

    function setChainIdFromEid(uint32 _eid, uint256 _chainId) public override onlyOwner {
        eidToChainId[_eid] = _chainId;
        chainIdToEid[_chainId] = _eid;
        emit ChainIdAdded(_eid, _chainId);
    }

    function getChainIdFromEid(uint32 _eid) public view override returns (uint256) {
        return eidToChainId[_eid];
    }

    function getEidFromChainId(uint256 _chainId) public view override returns (uint32) {
        return chainIdToEid[_chainId];
    }

    function setAdapter(address _adapter) external override onlyOwner {
        if (_adapter == address(0)) {
            revert SettingZeroAddress();
        }
        adapter = _adapter;
    }

    /**
     * @dev Internal function override to handle incoming messages from another chain.
     * @dev _origin A struct containing information about the message sender.
     * @dev _guid A unique global packet identifier for the message.
     * @param payload The encoded message payload being received.
     *
     * @dev The following params are unused in the current implementation of the OApp.
     * @dev _executor The address of the Executor responsible for processing the message.
     * @dev _extraData Arbitrary data appended by the Executor to the message.
     *
     * Decodes the received payload and processes it as per the business logic defined in the function.
     */
    function _lzReceive(
        Origin calldata origin,
        bytes32 /*_guid*/,
        bytes calldata payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        uint256 chainId = getChainIdFromEid(origin.srcEid);
        emit CrossChainMessageReceived(chainId, msg.value, payload);

        if (msg.value > 0) {
            ICrossChainAdapter(adapter).receiveCrosschainEth{ value: msg.value }(chainId);
        }

        if (payload.length > 0) {
            try ICrossChainAdapter(adapter).handleCrossChainData(chainId, payload) {
                emit CrossChainDataSuccessfullyRelayed(chainId);
            } catch Error(string memory reason) {
                emit CrossChainDataProcessingFailed(chainId, reason);
            }
        }
    }
}

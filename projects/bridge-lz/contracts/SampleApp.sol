// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OApp, MessagingFee, Origin} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {MessagingReceipt} from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import {OptionsBuilder} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";

contract SampleApp is OApp {
    using OptionsBuilder for bytes;

    constructor(
        address _endpoint,
        address _delegate
    ) OApp(_endpoint, _delegate) Ownable(_delegate) {}

    event DataSent();
    event EthSent(uint256 amount);
    event DataReceived();
    event EthReceived(uint256 amount);

    string public data = "Nothing received yet.";

    function sendData(
        uint32 _dstEid,
        string memory _message,
        uint256 _gas
    ) external payable {
        bytes memory options = createLzReceiveOption(_gas, 0);
        bytes memory _payload = abi.encode(_message);
        _lzSend(
            _dstEid,
            _payload,
            options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );

        emit DataSent();
    }

    function sendEth(
        uint32 _dstEid,
        uint256 _value,
        uint256 _gas
    ) external payable {
        bytes memory options = createLzReceiveOption(_gas, _value);
        _lzSend(
            _dstEid,
            "",
            options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );

        emit EthSent(_value);
    }

    function quoteData(
        uint32 _dstEid,
        string memory _message,
        uint256 _gas
    ) public view returns (uint256) {
        bytes memory payload = abi.encode(_message);
        bytes memory options = createLzReceiveOption(_gas, 0);
        MessagingFee memory fee = _quote(_dstEid, payload, options, false);
        return fee.nativeFee;
    }

    function quoteSendEth(
        uint32 _dstEid,
        uint256 _value,
        uint256 _gas
    ) public view returns (uint256) {
        bytes memory options = createLzReceiveOption(_gas, _value);
        MessagingFee memory fee = _quote(_dstEid, "", options, false);
        return fee.nativeFee;
    }

    function setPeer(uint32 _eid, bytes32 _peer) public override {
        _setPeer(_eid, _peer);
    }

    function createLzReceiveOption(
        uint256 _gas,
        uint256 _value
    ) public pure returns (bytes memory) {
        return
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(
                uint128(_gas),
                uint128(_value)
            );
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
        Origin calldata /*_origin*/,
        bytes32 /*_guid*/,
        bytes calldata payload,
        address /*_executor*/,
        bytes calldata /*_extraData*/
    ) internal override {
        data = abi.decode(payload, (string));
        if (msg.value > 0) {
            emit EthReceived(msg.value);
        }
    }
}

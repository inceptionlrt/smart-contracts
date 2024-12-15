// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IFraxFerry} from "../interfaces/FraxFerry/IFraxFerry.sol";

/**
 * @title FerryAdapterL1
 * @author The InceptionLRT team
 * @dev TODO
 */
contract FerryAdapterL1 is Initializable, Ownable2StepUpgradeable {
    IFraxFerry public bridge;

    // modifier onlyOwnerRestricted()
    //     override(AbstractCrossChainAdapter, AbstractLZCrossChainAdapter) {
    //     _checkOwner();
    //     _;
    // }

    // modifier onlyTargetReceiverRestricted() override {
    //     require(
    //         msg.sender == targetReceiver || msg.sender == owner(),
    //         NotTargetReceiver(msg.sender)
    //     );
    //     _;
    // }

    /// @dev
    function initialize() public initializer {
        __Ownable_init(msg.sender);
    }

    function sendEthCrossChain()
        external
        payable
        returns (
            //   onlyTargetReceiverRestricted
            uint256
        )
    {
        // TODO
        return _sendCrosschain(0, address(0));
    }

    function _sendCrosschain(uint256 amount, address recipient)
        internal
        returns (uint256)
    {
        bridge.embarkWithRecipient(amount, recipient);

        // uint32 dstEid = getEidFromChainId(_chainId);
        // MessagingReceipt memory receipt = _lzSend(
        //     dstEid,
        //     _payload,
        //     _options,
        //     MessagingFee(msg.value, 0),
        //     payable(msg.sender)
        // );
        // uint256 fee = receipt.fee.nativeFee - this.getValueFromOpts(_options);
        // emit CrossChainMessageSent(
        //     _chainId,
        //     this.getValueFromOpts(_options),
        //     _payload,
        //     fee
        // );
        // return fee;
    }
}

// SPDX-License-Identifier: MIT

pragma solidity 0.8.27;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { OApp, MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { MessagingReceipt } from "@layerzerolabs/oapp-evm/contracts/oapp/OAppSender.sol";
import { ICrossChainBridge } from "./interfaces/ICrossChainBridge.sol";
import { ICrossChainAdapter } from "./interfaces/ICrossChainAdapter.sol";
import { ICrossChainAdapter } from "./interfaces/ICrossChainAdapter.sol";
import { ITransactionStorage } from "./interfaces/ITransactionStorage.sol";
import { OAppUpgradeable } from "./OAppUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

contract CrossChainBridge is ICrossChainBridge, ICrossChainAdapter, OAppUpgradeable, Initializable, OwnableUpgradeable {
    address public vault;

    mapping(uint32 => uint256) public eidToChainId;
    mapping(uint256 => uint32) public chainIdToEid;

    // Note that "vault" is a general term here encompassing both InceptionOmniVault and Vault
    modifier onlyVault() {
        if (msg.sender != vault && msg.sender != owner()) {
            revert NotVault(msg.sender);
        }
        _;
    }

    function initialize(
        address _endpoint,
        address _delegate,
        address _vault,
        uint32[] memory _eIds,
        uint256[] memory _chainIds
    ) public initializer {
        require(_vault != address(0), SettingZeroAddress());
        __Ownable_init(msg.sender);
        __OAppUpgradeable_init(_endpoint, _delegate);

        vault = _vault;
        require(_eIds.length == _chainIds.length, ArraysLengthsMismatch());

        for (uint256 i = 0; i < _eIds.length; i++) {
            setChainIdFromEid(_eIds[i], _chainIds[i]);
        }
    }

    // ================= Cross-Chain Bridge Functions ======================

    function sendCrosschain(
        uint256 _chainId,
        bytes memory _payload,
        bytes memory _options
    ) public payable override onlyVault {
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
        sendCrosschain(_chainId, new bytes(0), new bytes(0));
    }

    function recoverFunds() external override onlyOwner {
        require(vault != address(0), VaultNotSet());
        uint256 amount = address(this).balance;
        (bool success, ) = vault.call{ value: amount }("");
        require(success, TransferToVaultFailed());
        emit RecoverFundsInitiated(amount);
    }

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

    function quoteSendEth(uint256 _chainId) external view override returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        if (dstEid == 0) revert NoDestEidFoundForChainId(_chainId);

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

    // ================= Cross-Chain Adapter Functions ======================

    function setVault(address _newVault) external onlyOwner {
        require(_newVault != address(0), SettingZeroAddress());
        emit VaultChanged(vault, _newVault);
        vault = _newVault;
    }

    function _decodeCalldata(bytes calldata payload) internal pure returns (uint256, uint256, uint256) {
        (uint256 timestamp, uint256 balance, uint256 totalSupply) = abi.decode(payload, (uint256, uint256, uint256));
        return (timestamp, balance, totalSupply);
    }

    receive() external payable override {
        emit ReceiveTriggered(msg.sender, msg.value);
        Address.sendValue(payable(vault), msg.value);
    }

    // ================== LayerZero Message Receiver ======================

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
            _handleCrossChainEth(chainId);
        }

        if (payload.length > 0) {
            _handleCrossChainData(chainId, payload);
        }
    }

    function _handleCrossChainData(uint256 _chainId, bytes calldata _payload) internal {
        require(vault != address(0), VaultNotSet());
        (uint256 timestamp, uint256 balance, uint256 totalSupply) = _decodeCalldata(_payload);
        if (timestamp > block.timestamp) {
            revert FutureTimestamp();
        }
        ITransactionStorage(vault).handleL2Info(_chainId, timestamp, balance, totalSupply);
        emit CrossChainInfoReceived(_chainId, timestamp, balance, totalSupply);
    }

    function _handleCrossChainEth(uint256 _chainId) internal {
        emit CrossChainEthDeposit(_chainId, msg.value);
        Address.sendValue(payable(vault), msg.value);
    }
}

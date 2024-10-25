// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract LZCrossChainAdapterL1Mock is Ownable {
    event CrossChainMessageSent(
        uint256 indexed chainId,
        uint256 value,
        bytes data,
        uint256 fee
    );
    event ChainIdAdded(uint256 _chainId);
    event CrossChainEthDeposit(uint256 chainId, uint256 amount);
    event ReceiveTriggered(address caller, uint256 amount);
    event CrossChainMessageReceived(
        uint256 indexed chainId,
        uint256 value,
        bytes data
    );
    event CrossChainDataSuccessfullyRelayed(uint256 indexed chainId);

    // Mocked storage variables
    mapping(uint32 => uint256) public eidToChainId;
    mapping(uint256 => uint32) public chainIdToEid;
    address public targetReceiver;

    modifier onlyOwnerRestricted() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    modifier onlyTargetReceiver() {
        require(
            msg.sender == targetReceiver || msg.sender == owner(),
            "NotTargetReceiver"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    // Functions for managing target receiver
    function setTargetReceiver(
        address _newTargetReceiver
    ) external onlyOwnerRestricted {
        require(_newTargetReceiver != address(0), "SettingZeroAddress");
        targetReceiver = _newTargetReceiver;
    }

    function recoverFunds() external onlyOwnerRestricted {
        require(targetReceiver != address(0), "TargetReceiverNotSet");
        uint256 amount = address(this).balance;
        (bool success, ) = targetReceiver.call{value: amount}("");
        require(success, "TransferToTargetReceiverFailed");
    }

    // Mocked cross-chain function
    function sendEthCrossChain(
        uint256 _chainId
    ) external payable onlyTargetReceiver {
        emit CrossChainMessageSent(_chainId, msg.value, "", 0);
    }

    // Manage chain IDs
    function setChainIdFromEid(
        uint32 _eid,
        uint256 _chainId
    ) public onlyOwnerRestricted {
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

    // Functions to simulate ETH handling for cross-chain deposits
    function _handleCrossChainEth(uint256 _chainId) internal {
        emit CrossChainEthDeposit(_chainId, msg.value);
        payable(targetReceiver).transfer(msg.value);
    }

    function quoteSendEth(
        uint256,
        bytes memory
    ) external pure returns (uint256) {
        return 1000;
    }

    // Fallback function to handle direct ETH transfers
    receive() external payable {
        emit ReceiveTriggered(msg.sender, msg.value);
    }

    /**
     * @notice Mock function to simulate receiving a cross-chain message.
     * @param _eid The endpoint ID associated with the origin chain.
     * @param _data The payload or data being sent cross-chain.
     */
    function mockLzReceive(uint32 _eid, bytes calldata _data) external payable {
        uint256 chainId = eidToChainId[_eid];
        require(chainId != 0, "InvalidEid");

        emit CrossChainMessageReceived(chainId, msg.value, _data);

        // If data was provided, consider it as a relay of data successfully
        if (_data.length > 0) {
            emit CrossChainDataSuccessfullyRelayed(chainId);
        }

        // Handle ETH transfer if any ETH was sent
        if (msg.value > 0) {
            _handleCrossChainEth(chainId);
        }
    }
}

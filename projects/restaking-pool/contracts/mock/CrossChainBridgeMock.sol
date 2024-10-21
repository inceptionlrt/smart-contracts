// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ICrossChainBridge} from "../interfaces/ICrossChainBridge.sol";
import {ICrossChainAdapter} from "../interfaces/ICrossChainAdapter.sol";

contract CrossChainBridgeMock is Ownable, ICrossChainBridge {
    address public adapter;
    mapping(uint32 => uint256) public eidToChainId;
    mapping(uint256 => uint32) public chainIdToEid;

    constructor(address _delegate) Ownable(_delegate) {
        setChainIdFromEid(40161, 11155111);
        setChainIdFromEid(40231, 421614);
        setChainIdFromEid(40232, 11155420);
    }

    /**
     * @notice Mock function for sending a cross-chain message.
     */
    function sendCrosschain(
        uint256 _chainId,
        bytes calldata _payload,
        bytes calldata /*_options*/
    ) external payable {
        require(msg.sender == owner() || msg.sender == adapter, "Unauthorized");
        require(adapter != address(0), "No adapter set");

        uint32 dstEid = getEidFromChainId(_chainId);
        require(dstEid != 0, "Wrong or empty Chain ID!");
        uint256 fee = quoteSendEth(_chainId);

        emit CrossChainMessageSent(_chainId, msg.value, _payload, fee);
    }

    /**
     * @notice Mock function to quote fees.
     */
    function quote(
        uint256 _chainId,
        bytes calldata /*_payload*/,
        bytes memory /*_options*/,
        bool /*_payInLzToken*/
    ) public view returns (uint256) {
        uint32 dstEid = getEidFromChainId(_chainId);
        require(dstEid != 0, "No destination EID found");
        return 1200; // Mock fee amount
    }

    function quoteSendEth(uint256 _chainId) public view returns (uint256) {
        // Check if the chainId has a corresponding eid
        uint32 dstEid = getEidFromChainId(_chainId);
        require(dstEid != 0, "No corresponding EID for this chainId");

        // Return a hardcoded fee for the mock
        return 1000;
    }

    /**
     * @notice Set the chainId from an EID.
     */
    function setChainIdFromEid(uint32 _eid, uint256 _chainId) public onlyOwner {
        eidToChainId[_eid] = _chainId;
        chainIdToEid[_chainId] = _eid;
        emit ChainIdAdded(_eid, _chainId);
    }

    function getChainIdFromEid(uint32 _eid) public view returns (uint256) {
        return eidToChainId[_eid];
    }

    function getEidFromChainId(uint256 _chainId) public view returns (uint32) {
        return chainIdToEid[_chainId];
    }

    /**
     * @notice Set the adapter address.
     */
    function setAdapter(address _adapter) external onlyOwner {
        require(_adapter != address(0), "Setting zero address");
        adapter = _adapter;
    }

    /**
     * @dev Used to simulate cross-chain receives in tests
     */
    function mockLzReceive(uint32 _eId, bytes calldata _payload) external payable {
        uint256 chainId = getChainIdFromEid(_eId);
        emit CrossChainMessageReceived(chainId, msg.value, _payload);

        if (msg.value > 0) {
            ICrossChainAdapter(adapter).receiveCrosschainEth{value: msg.value}(
                chainId
            );
        }

        if (_payload.length > 0) {
            try
                ICrossChainAdapter(adapter).handleCrossChainData(
                    chainId,
                    _payload
                )
            {
                emit CrossChainDataSuccessfullyRelayed(chainId);
            } catch Error(string memory reason) {
                emit CrossChainDataProcessingFailed(chainId, reason);
            }
        }
    }
}

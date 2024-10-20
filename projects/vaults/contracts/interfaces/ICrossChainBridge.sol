// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface ICrossChainBridge {
    event CrossChainMessageReceived(
        uint256 indexed chainId,
        uint256 value,
        bytes data
    );
    event CrossChainMessageSent(
        uint256 indexed chainId,
        uint256 value,
        bytes data,
        uint256 fee
    );
    event ChainIdAdded(uint32 indexed _eid, uint256 indexed _chainId);
    event CrossChainDataSuccessfullyRelayed(uint256 indexed chainId);
    event CrossChainDataProcessingFailed(
        uint256 indexed chainId,
        string reason
    );

    error SettingZeroAddress();
    error NoAdapterSet();
    error Unauthorized(address caller);

    function adapter() external view returns (address);

    function eidToChainId(uint32 _eid) external view returns (uint256);

    function chainIdToEid(uint256 _chainId) external view returns (uint32);

    function sendCrosschain(
        uint256 _chainId,
        bytes calldata _payload,
        bytes calldata _options
    ) external payable;

    function setAdapter(address _adapter) external;

    function quote(
        uint256 _chainId,
        bytes calldata _payload,
        bytes memory _options,
        bool _payInLzToken
    ) external returns (uint256);

    function setChainIdFromEid(uint32 _eid, uint256 _chainId) external;

    function getChainIdFromEid(uint32 _eid) external view returns (uint256);

    function getEidFromChainId(uint256 _chainId) external view returns (uint32);
}

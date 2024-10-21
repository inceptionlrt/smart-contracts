// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ICrossChainAdapterL2} from "./interfaces/ICrossChainAdapterL2.sol";
import {ICrossChainBridge} from "./interfaces/ICrossChainBridge.sol";
import {InceptionOmniVault} from "./vaults/InceptionOmniVault.sol";

contract CrossChainAdapterL2 is
    Initializable,
    ICrossChainAdapterL2,
    OwnableUpgradeable
{
    address public crosschainBridge;
    address public omniVault;
    address public operator;
    uint256 public l1ChainId;

    modifier onlyOmniVault() {
        if (msg.sender != omniVault && msg.sender != owner()) {
            revert OnlyOmniVaultCanCall(msg.sender);
        }
        _;
    }

    modifier onlyOperator() {
        if (msg.sender != operator && msg.sender != owner()) {
            revert OnlyOperatorCanCall(msg.sender);
        }
        _;
    }

    function initialize(
        address _crosschainBridge,
        address _omniVault,
        address _operator,
        uint256 _l1ChainId
    ) public initializer {
        require(
            _crosschainBridge != address(0) &&
                _omniVault != address(0) &&
                _operator != address(0),
            SettingZeroAddress()
        );
        __Ownable_init(msg.sender);
        crosschainBridge = _crosschainBridge;
        omniVault = _omniVault;
        operator = _operator;
        l1ChainId = _l1ChainId;
    }

    /// @dev msg.value is used to pay fees
    function sendDataToL1(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external payable override {
        require(crosschainBridge != address(0), BridgeNotSet());
        bytes memory payload = _encodeDataMessage(
            _timestamp,
            _balance,
            _totalSupply
        );
        ICrossChainBridge(crosschainBridge).sendCrosschain{value: msg.value}(
            l1ChainId,
            payload,
            ""
        );
    }

    function quote(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external view override returns (uint256) {
        require(crosschainBridge != address(0), BridgeNotSet());
        bytes memory payload = _encodeDataMessage(
            _timestamp,
            _balance,
            _totalSupply
        );
        return
            ICrossChainBridge(crosschainBridge).quote(
                l1ChainId,
                payload,
                "",
                false
            );
    }

    /// @dev Called by OmniVault to send ETH to L1
    function sendEthToL1() external payable override onlyOmniVault {
        require(crosschainBridge != address(0), BridgeNotSet());
        ICrossChainBridge(crosschainBridge).sendCrosschain{value: msg.value}(
            l1ChainId,
            "",
            ""
        );
    }

    function quoteSendEth() external view override returns (uint256) {
        require(crosschainBridge != address(0), BridgeNotSet());
        return ICrossChainBridge(crosschainBridge).quoteSendEth(l1ChainId);
    }

    /// @dev Receives ETH from L2 and transfers it to the rebalancer.
    function receiveCrosschainEth(uint256) external payable override {
        emit L1EthDeposit(msg.value);
        Address.sendValue(payable(omniVault), msg.value);
    }

    /// @dev Allows recovering stuck funds to the omniVault.
    function recoverFunds() external override onlyOwner {
        require(omniVault != address(0), OmniVaultNotSet());
        uint256 amount = address(this).balance;
        (bool success, ) = omniVault.call{value: amount}("");
        require(success, TransferToOmniVaultFailed());
        emit RecoverFundsInitiated(amount);
    }

    function setCrossChainBridge(
        address _newCrossChainBridge
    ) external override onlyOwner {
        require(_newCrossChainBridge != address(0), SettingZeroAddress());
        emit CrossChainBridgeChanged(crosschainBridge, _newCrossChainBridge);
        crosschainBridge = _newCrossChainBridge;
    }

    function setOmniVault(address _newOmniVault) external override onlyOwner {
        require(_newOmniVault != address(0), SettingZeroAddress());
        emit OmniVaultChanged(omniVault, _newOmniVault);
        omniVault = _newOmniVault;
    }

    /// @dev Reserved for future use cases of L1-to-L1 data messaging.
    function handleCrossChainData(
        uint256,
        bytes calldata
    ) external pure override {
        revert Unimplemented();
    }

    function _encodeDataMessage(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) internal pure returns (bytes memory) {
        return abi.encode(_timestamp, _balance, _totalSupply);
    }

    /// @dev a function just in case
    receive() external payable override {
        emit ReceiveTriggered(msg.sender, msg.value);
        Address.sendValue(payable(omniVault), msg.value);
    }
}

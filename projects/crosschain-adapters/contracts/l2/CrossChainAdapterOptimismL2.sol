// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@eth-optimism/contracts/L2/messaging/IL2CrossDomainMessenger.sol";
import "@eth-optimism/contracts/L2/messaging/L2StandardBridge.sol";
import "openzeppelin-4/access/Ownable.sol";
import "openzeppelin-4/security/ReentrancyGuard.sol";

import "../interface/ICrossChainAdapterL2.sol";

interface PayableCrossDomainMessenger {
    function sendMessage(
        address _target,
        bytes calldata _message,
        uint32 _gasLimit
    ) external payable;
}

contract CrossChainAdapterOptimismL2 is
    ICrossChainAdapterL2,
    Ownable,
    ReentrancyGuard
{
    IL2CrossDomainMessenger public immutable l2Messenger;
    L2StandardBridge public immutable l2StandardBridge;
    address public l1Target;
    address public vault;
    uint256 maxGas = 20_000_000;

    event AssetsInfoSentToL1(
        uint256 tokensAmount,
        uint256 ethAmount,
        bytes32 messageId
    );
    event EthSentToL1(uint256 amount);

    modifier onlyVault() {
        if (vault == address(0)) {
            revert VaultNotSet();
        }
        if (msg.sender != vault) {
            revert OnlyVault();
        }
        _;
    }

    constructor(
        IL2CrossDomainMessenger _l2Messenger,
        L2StandardBridge _l2StandardBridge,
        address _l1Target
    ) {
        l2Messenger = _l2Messenger;
        l2StandardBridge = _l2StandardBridge;
        l1Target = _l1Target;
    }

    function setL1Target(address _l1Target) external onlyOwner {
        l1Target = _l1Target;
    }

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }

    /**
     * @dev Send token and ETH information to L1
     * @param tokensAmount Amount of tokens to send
     * @param ethAmount Amount of ETH to send
     * @return success True if the message was sent
     */
    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount
    ) external override returns (bool success) {
        bytes memory data = abi.encodeWithSignature(
            "receiveAssetsInfo(uint256,uint256)",
            tokensAmount,
            ethAmount
        );

        // Send the message to the L1 target contract
        l2Messenger.sendMessage(
            l1Target,
            data,
            200_000 // Gas limit for L1 execution, adjust as needed
        );

        bytes32 messageId = keccak256(data); // Optional: Generate a unique message ID
        emit AssetsInfoSentToL1(tokensAmount, ethAmount, messageId);

        return true;
    }

    /**
     * @dev Sends ETH from L2 to L1 using the Optimism bridge
     */
    function sendEthToL1(
        uint256 _callValue,
        uint256 _fees
    ) external payable override onlyVault nonReentrant returns (bool success) {
        require(_callValue <= msg.value, "Insufficient ETH sent");
        // Use the L2 Standard Bridge to send ETH to the L1 target contract
        l2StandardBridge.withdrawTo(
            address(0),
            l1Target,
            _callValue,
            uint32(maxGas),
            ""
        );

        // PayableCrossDomainMessenger(address(l2Messenger)).sendMessage{
        //     value: msg.value
        // }(l1Target, "", uint32(maxGas));

        emit EthSentToL1(msg.value);

        return true;
    }
}

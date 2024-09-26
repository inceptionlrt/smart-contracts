// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@eth-optimism/contracts/L2/messaging/IL2CrossDomainMessenger.sol";
import "@eth-optimism/contracts/L2/messaging/L2StandardBridge.sol";
import "openzeppelin-4/access/Ownable.sol";
import "../interface/ICrossChainAdapterL2.sol";


contract CrossChainAdapterOptimismL2 is ICrossChainAdapterL2, Ownable {
    IL2CrossDomainMessenger public immutable l2CrossDomainMessenger;
    L2StandardBridge public immutable l2StandardBridge;
    address public l1Target;
    address public vault;
    uint256 maxGas = 3_000_000;

    event AssetsInfoSentToL1(
        uint256 indexed tokensAmount,
        uint256 indexed ethAmount
    );
    event EthSentToL1(uint256 indexed amount);

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
        IL2CrossDomainMessenger _l2CrossDomainMessenger,
        L2StandardBridge _l2StandardBridge,
        address _l1Target
    ) {
        l2CrossDomainMessenger = _l2CrossDomainMessenger;
        l2StandardBridge = _l2StandardBridge;
        l1Target = _l1Target;
    }

    /// @dev Allows the owner to set the L1 target address for cross-chain messaging.
    function setL1Target(address _l1Target) external onlyOwner {
        l1Target = _l1Target;
    }

    /// @notice Send information about assets to L1, using the cross-domain messenger.
    /// @dev Sends encoded message to the L1 target contract.
    /// @param tokensAmount Amount of tokens on L2
    /// @param ethAmount Amount of ETH on L2
    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount
    ) external override returns (bool success) {
        bytes memory data = abi.encodeWithSignature(
            "receiveAssetsInfo(uint256,uint256)",
            tokensAmount,
            ethAmount
        );

        // Use Optimism L2 cross-domain messenger to send the message to L1.
        l2CrossDomainMessenger.sendMessage(l1Target, data, 200_000);

        emit AssetsInfoSentToL1(tokensAmount, ethAmount);
        return true;
    }

    /// @notice Sends ETH to L1 using the L2StandardBridge.
    /// @dev Transfers ETH from L2 to L1 through the Optimism L2 Standard Bridge.
    function sendEthToL1()
        external
        payable
        override
        onlyVault
        returns (bool success)
    {
        require(msg.value > 0, "No ETH sent");

        // l2CrossDomainMessenger.sendMessage{value: msg.value}({
        //     _target: l1Target,
        //     _message: "",
        //     _gasLimit: uint32(maxGas)
        // });

        l2StandardBridge.withdrawTo()

        emit EthSentToL1(msg.value);
        return true;
    }

    function setMaxGas(uint256 _maxGas) external onlyOwner {
        require(_maxGas > 0, SettingZeroGas());
        maxGas = _maxGas;
        emit MaxGasChanged(_maxGas);
    }

    /// @dev Allows the owner to set the vault address.
    /// @param _vault The address of the vault allowed to call `sendEthToL1`.
    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }
}

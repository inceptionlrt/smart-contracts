// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/bridge/IOutbox.sol";
import "@arbitrum/nitro-contracts/src/bridge/IBridge.sol";
import "openzeppelin-4-upgradeable/access/OwnableUpgradeable.sol";
import "openzeppelin-4-upgradeable/proxy/utils/Initializable.sol";

import "../interface/ICrossChainAdapterL2.sol";

contract CrossChainAdapterArbitrumL2 is
    ICrossChainAdapterL2,
    Initializable,
    OwnableUpgradeable
{
    ArbSys constant arbsys = ArbSys(address(100));
    address public l1Target;
    address public vault;

    modifier onlyVault() {
        if (vault == address(0)) {
            revert VaultNotSet();
        }
        if (msg.sender != vault) {
            revert OnlyVault();
        }
        _;
    }

    event AssetsInfoSentToL1(
        uint256 indexed tokensAmount,
        uint256 indexed ethAmount,
        uint256 indexed ticketId
    );
    event EthSentToL1(uint256 indexed amount, uint256 indexed ticketId);

    // Replaces constructor for upgradeable contracts
    function initialize(address _l1Target, address _owner) public initializer {
        __Ownable_init();
        l1Target = _l1Target;
        transferOwnership(_owner); // Set the owner after initialization
    }

    function setL1Target(address _l1Target) external onlyOwner {
        l1Target = _l1Target;
    }

    function sendAssetsInfoToL1(
        uint256 tokensAmount,
        uint256 ethAmount
    ) external returns (bool success) {
        bytes memory data = abi.encodeWithSignature(
            "receiveAssetsInfo(uint256,uint256)",
            tokensAmount,
            ethAmount
        );

        uint256 withdrawalId = arbsys.sendTxToL1(l1Target, data);

        emit AssetsInfoSentToL1(tokensAmount, ethAmount, withdrawalId);
        return true;
    }

    function sendEthToL1(
        uint256 _callValue
    ) external payable override onlyVault returns (bool success) {
        require(_callValue <= msg.value, InsufficientValueSent());
        uint256 withdrawalId = arbsys.withdrawEth{value: msg.value}(l1Target);

        emit EthSentToL1(msg.value, withdrawalId);
        return true;
    }

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "openzeppelin-4-upgradeable/access/OwnableUpgradeable.sol";
import "openzeppelin-4-upgradeable/proxy/utils/Initializable.sol";
import "../interface/ICrossChainAdapterL2.sol";

abstract contract AbstractCrossChainAdapterL2 is
    ICrossChainAdapterL2,
    Initializable,
    OwnableUpgradeable
{
    address public l1Target;
    address public vault;
    address public operator;

    modifier onlyVault() {
        if (vault == address(0)) {
            revert VaultNotSet();
        }
        if (msg.sender != vault) {
            revert OnlyVault();
        }
        _;
    }

    modifier onlyOperator() {
        if (msg.sender != operator) {
            revert OnlyOperatorCanCall(msg.sender);
        }
        _;
    }

    function initialize(
        address _l1Target,
        address _owner,
        address _operator
    ) public virtual initializer {
        __Ownable_init();
        l1Target = _l1Target;
        transferOwnership(_owner);
        operator = _operator;
    }

    function setL1Target(address _l1Target) external onlyOwner {
        require(_l1Target != address(0), SettingZeroAddress());
        l1Target = _l1Target;
    }

    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), SettingZeroAddress());
        vault = _vault;
    }

    function recoverFunds() external onlyOperator {
        require(vault != address(0), VaultNotSet());
        (bool ok, ) = vault.call{value: address(this).balance}("");
        require(ok, TransferToVaultFailed(address(this).balance));
    }

    receive() external payable {
        emit ReceiveTriggered(msg.value);
    }
}

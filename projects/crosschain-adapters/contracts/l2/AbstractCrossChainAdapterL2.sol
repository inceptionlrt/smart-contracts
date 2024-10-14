// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "openzeppelin-4-upgradeable/access/OwnableUpgradeable.sol";
import "openzeppelin-4-upgradeable/proxy/utils/Initializable.sol";
import "../interface/ICrossChainAdapterL2.sol";

/**
 * @dev Abstract base contract for Layer 2 cross-chain adapters.
 */
abstract contract AbstractCrossChainAdapterL2 is
    ICrossChainAdapterL2,
    Initializable,
    OwnableUpgradeable
{
    address public l1Target;

    address public vault;

    address public operator;

    /**
     * @dev Ensures that the function is called by the vault.
     * Reverts if the vault is not set or if the caller is not the vault.
     */
    modifier onlyVault() {
        if (vault == address(0)) {
            revert VaultNotSet();
        }
        if (msg.sender != vault) {
            revert OnlyVault();
        }
        _;
    }

    /**
     * @dev Ensures that the function is called by the operator.
     * Reverts if the caller is not the operator.
     */
    modifier onlyOperator() {
        if (msg.sender != operator) {
            revert OnlyOperatorCanCall(msg.sender);
        }
        _;
    }

    /**
     * @notice Initializes the contract with the L1 target, owner, and operator addresses.
     * @param _l1Target Address of the L1 target contract (L1 CrossChainAdapter).
     * @param _owner Owner address.
     * @param _operator Operator address.
     */
    function __AbstractCrossChainAdapterL1_init(
        address _l1Target,
        address _owner,
        address _operator
    ) public virtual initializer {
        __Ownable_init();
        l1Target = _l1Target;
        transferOwnership(_owner);
        operator = _operator;
    }

    /**
     * @notice Updates the L1 target address.
     * @param _l1Target Address of the new L1 target (L1 CrossChainAdapter).
     * @dev Can only be called by the owner.
     */
    function setL1Target(address _l1Target) external onlyOwner {
        require(_l1Target != address(0), SettingZeroAddress());
        emit L1TargetChanged(l1Target, _l1Target);
        l1Target = _l1Target;
    }

    /**
     * @notice Updates the vault address.
     * @param _vault New vault address.
     * @dev Can only be called by the owner.
     */
    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), SettingZeroAddress());
        emit VaultChanged(vault, _vault);
        vault = _vault;
    }

    /**
     * @notice Recovers all ETH stored in the contract (in the unlikely case of dust values accumulation) and transfers it to the vault.
     * @dev Can only be called by the operator.
     */
    function recoverFunds() external onlyOperator {
        require(vault != address(0), VaultNotSet());
        uint256 amount = address(this).balance;
        (bool ok, ) = vault.call{value: amount}("");
        require(ok, TransferToVaultFailed(amount));
        emit RecoverFundsInitiated(amount);
    }

    function setOperator(address _newOperator) external onlyOwner {
        emit OperatorChanged(operator, _newOperator);
        operator = _newOperator;
    }

    /**
     * @notice Fallback function to handle incoming ETH, just in case it will be needed for fee refund.
     * @dev Emits the `ReceiveTriggered` event.
     */
    receive() external payable {
        emit ReceiveTriggered(msg.sender, msg.value);
    }
}

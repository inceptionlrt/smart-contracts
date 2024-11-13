// SPDX-License-Identifier: BSL-1.1
pragma solidity 0.8.25;

import "./interfaces/IVaultConfigurator.sol";

import "./DefaultAccessControl.sol";

contract VaultConfigurator is IVaultConfigurator, ReentrancyGuard {
    /// @inheritdoc IVaultConfigurator
    uint256 public constant MAX_DELAY = 365 days;
    /// @inheritdoc IVaultConfigurator
    uint256 public constant MAX_WITHDRAWAL_FEE = 5e7; // 5%
    /// @inheritdoc IVaultConfigurator
    address public immutable vault;

    Data private _baseDelay;

    Data private _depositCallbackDelay;
    Data private _withdrawalCallbackDelay;
    Data private _withdrawalFeeD9Delay;
    Data private _maximalTotalSupplyDelay;
    Data private _isDepositLockedDelay;
    Data private _areTransfersLockedDelay;
    Data private _isDelegateModuleApprovedDelay;
    Data private _ratiosOracleDelay;
    Data private _priceOracleDelay;
    Data private _validatorDelay;
    Data private _emergencyWithdrawalDelay;

    Data private _depositCallback;
    Data private _withdrawalCallback;
    Data private _withdrawalFeeD9;
    Data private _maximalTotalSupply;
    Data private _isDepositLocked; // nothing
    Data private _areTransfersLocked;
    Data private _ratiosOracle;
    Data private _priceOracle;
    Data private _validator;

    mapping(address => Data) private _isDelegateModuleApproved; // bool

    constructor() {
        vault = msg.sender;
    }

    modifier onlyAdmin() {
        IDefaultAccessControl(vault).requireAdmin(msg.sender);
        _;
    }

    modifier atLeastOperator() {
        IDefaultAccessControl(vault).requireAtLeastOperator(msg.sender);
        _;
    }

    function _stage(Data storage s, uint256 value) private {
        s.stageTimestamp = block.timestamp;
        s.stagedValue = value;
        bytes32 slot;
        assembly {
            slot := s.slot
        }
        emit Stage(slot, s, value, block.timestamp);
    }

    function _commit(Data storage s, Data storage delay) private {
        uint256 timestamp = s.stageTimestamp;
        if (timestamp == 0) revert InvalidTimestamp();
        if (block.timestamp - timestamp < delay.value)
            revert InvalidTimestamp();
        bytes32 slot;
        assembly {
            slot := s.slot
        }
        emit Commit(slot, s, block.timestamp);
        s.value = s.stagedValue;
        delete s.stageTimestamp;
        delete s.stagedValue;
    }

    function _rollback(Data storage s) private {
        bytes32 slot;
        assembly {
            slot := s.slot
        }
        emit Rollback(slot, s, block.timestamp);
        delete s.stageTimestamp;
        delete s.stagedValue;
    }

    /// @inheritdoc IVaultConfigurator
    function isDelegateModuleApproved(
        address module
    ) external view returns (bool) {
        return _isDelegateModuleApproved[module].value != 0;
    }

    /// @inheritdoc IVaultConfigurator
    function isDepositLocked() external view returns (bool) {
        return _isDepositLocked.value != 0;
    }

    /// @inheritdoc IVaultConfigurator
    function areTransfersLocked() external view returns (bool) {
        return _areTransfersLocked.value != 0;
    }

    /// @inheritdoc IVaultConfigurator
    function maximalTotalSupply() external view returns (uint256) {
        return _maximalTotalSupply.value;
    }

    /// @inheritdoc IVaultConfigurator
    function depositCallback() external view returns (address) {
        return address(uint160(_depositCallback.value));
    }

    /// @inheritdoc IVaultConfigurator
    function withdrawalCallback() external view returns (address) {
        return address(uint160(_withdrawalCallback.value));
    }

    /// @inheritdoc IVaultConfigurator
    function withdrawalFeeD9() external view returns (uint256) {
        return _withdrawalFeeD9.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageDelegateModuleApproval(
        address module
    ) external onlyAdmin nonReentrant {
        if (module == address(0)) revert AddressZero();
        _stage(_isDelegateModuleApproved[module], 1);
    }

    /// @inheritdoc IVaultConfigurator
    function commitDelegateModuleApproval(
        address module
    ) external onlyAdmin nonReentrant {
        _commit(
            _isDelegateModuleApproved[module],
            _isDelegateModuleApprovedDelay
        );
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedDelegateModuleApproval(
        address module
    ) external onlyAdmin nonReentrant {
        _rollback(_isDelegateModuleApproved[module]);
    }

    /// @inheritdoc IVaultConfigurator
    function revokeDelegateModuleApproval(
        address module
    ) external onlyAdmin nonReentrant {
        _isDelegateModuleApproved[module].value = 0;
    }

    /// @inheritdoc IVaultConfigurator
    function stageDepositsLock() external atLeastOperator nonReentrant {
        _stage(_isDepositLocked, 1);
    }

    /// @inheritdoc IVaultConfigurator
    function commitDepositsLock() external atLeastOperator nonReentrant {
        _commit(_isDepositLocked, _isDepositLockedDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedDepositsLock()
        external
        atLeastOperator
        nonReentrant
    {
        _rollback(_isDepositLocked);
    }

    /// @inheritdoc IVaultConfigurator
    function revokeDepositsLock() external atLeastOperator nonReentrant {
        _isDepositLocked.value = 0;
    }

    /// @inheritdoc IVaultConfigurator
    function stageTransfersLock(bool flag) external onlyAdmin nonReentrant {
        _stage(_areTransfersLocked, flag ? 1 : 0);
    }

    /// @inheritdoc IVaultConfigurator
    function commitTransfersLock() external onlyAdmin nonReentrant {
        _commit(_areTransfersLocked, _areTransfersLockedDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedTransfersLock() external onlyAdmin nonReentrant {
        _rollback(_areTransfersLocked);
    }

    /// @inheritdoc IVaultConfigurator
    function stageMaximalTotalSupply(
        uint256 maximalTotalSupply_
    ) external onlyAdmin nonReentrant {
        if (maximalTotalSupply_ < IVault(vault).totalSupply())
            revert InvalidTotalSupply();
        _stage(_maximalTotalSupply, maximalTotalSupply_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitMaximalTotalSupply() external onlyAdmin nonReentrant {
        _commit(_maximalTotalSupply, _maximalTotalSupplyDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedMaximalTotalSupply()
        external
        onlyAdmin
        nonReentrant
    {
        _rollback(_maximalTotalSupply);
    }

    /// @inheritdoc IVaultConfigurator
    function stageDepositCallback(
        address callback
    ) external onlyAdmin nonReentrant {
        _stage(_depositCallback, uint160(callback));
    }

    /// @inheritdoc IVaultConfigurator
    function commitDepositCallback() external onlyAdmin nonReentrant {
        _commit(_depositCallback, _depositCallbackDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedDepositCallback() external onlyAdmin nonReentrant {
        _rollback(_depositCallback);
    }

    /// @inheritdoc IVaultConfigurator
    function stageWithdrawalCallback(
        address callback
    ) external onlyAdmin nonReentrant {
        _stage(_withdrawalCallback, uint160(callback));
    }

    /// @inheritdoc IVaultConfigurator
    function commitWithdrawalCallback() external onlyAdmin nonReentrant {
        _commit(_withdrawalCallback, _withdrawalCallbackDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedWithdrawalCallback()
        external
        onlyAdmin
        nonReentrant
    {
        _rollback(_withdrawalCallback);
    }

    /// @inheritdoc IVaultConfigurator
    function stageWithdrawalFeeD9(
        uint256 feeD9
    ) external onlyAdmin nonReentrant {
        if (feeD9 > MAX_WITHDRAWAL_FEE) revert InvalidWithdrawalFee();
        _stage(_withdrawalFeeD9, feeD9);
    }

    /// @inheritdoc IVaultConfigurator
    function commitWithdrawalFeeD9() external onlyAdmin nonReentrant {
        _commit(_withdrawalFeeD9, _withdrawalFeeD9Delay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedWithdrawalFeeD9() external onlyAdmin nonReentrant {
        _rollback(_withdrawalFeeD9);
    }

    /// @inheritdoc IVaultConfigurator
    function baseDelay() external view returns (uint256) {
        return _baseDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageBaseDelay(uint256 delay_) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_baseDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitBaseDelay() external onlyAdmin nonReentrant {
        _commit(_baseDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedBaseDelay() external onlyAdmin nonReentrant {
        _rollback(_baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function depositCallbackDelay() external view returns (uint256) {
        return _depositCallbackDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageDepositCallbackDelay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_depositCallbackDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitDepositCallbackDelay() external onlyAdmin nonReentrant {
        _commit(_depositCallbackDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedDepositCallbackDelay()
        external
        onlyAdmin
        nonReentrant
    {
        _rollback(_depositCallbackDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function withdrawalCallbackDelay() external view returns (uint256) {
        return _withdrawalCallbackDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageWithdrawalCallbackDelay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_withdrawalCallbackDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitWithdrawalCallbackDelay() external onlyAdmin nonReentrant {
        _commit(_withdrawalCallbackDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedWithdrawalCallbackDelay()
        external
        onlyAdmin
        nonReentrant
    {
        _rollback(_withdrawalCallbackDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function withdrawalFeeD9Delay() external view returns (uint256) {
        return _withdrawalFeeD9Delay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageWithdrawalFeeD9Delay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_withdrawalFeeD9Delay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitWithdrawalFeeD9Delay() external onlyAdmin nonReentrant {
        _commit(_withdrawalFeeD9Delay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedWithdrawalFeeD9Delay()
        external
        onlyAdmin
        nonReentrant
    {
        _rollback(_withdrawalFeeD9Delay);
    }

    /// @inheritdoc IVaultConfigurator
    function isDepositLockedDelay() external view returns (uint256) {
        return _isDepositLockedDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageDepositsLockedDelay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_isDepositLockedDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitDepositsLockedDelay() external onlyAdmin nonReentrant {
        _commit(_isDepositLockedDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedDepositsLockedDelay()
        external
        onlyAdmin
        nonReentrant
    {
        _rollback(_isDepositLockedDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function areTransfersLockedDelay() external view returns (uint256) {
        return _areTransfersLockedDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageTransfersLockedDelay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_areTransfersLockedDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitTransfersLockedDelay() external onlyAdmin nonReentrant {
        _commit(_areTransfersLockedDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedTransfersLockedDelay()
        external
        onlyAdmin
        nonReentrant
    {
        _rollback(_areTransfersLockedDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function delegateModuleApprovalDelay() external view returns (uint256) {
        return _isDelegateModuleApprovedDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageDelegateModuleApprovalDelay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_isDelegateModuleApprovedDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitDelegateModuleApprovalDelay()
        external
        onlyAdmin
        nonReentrant
    {
        _commit(_isDelegateModuleApprovedDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedDelegateModuleApprovalDelay()
        external
        onlyAdmin
        nonReentrant
    {
        _rollback(_isDelegateModuleApprovedDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function maximalTotalSupplyDelay() external view returns (uint256) {
        return _maximalTotalSupplyDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageMaximalTotalSupplyDelay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_maximalTotalSupplyDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitMaximalTotalSupplyDelay() external onlyAdmin nonReentrant {
        _commit(_maximalTotalSupplyDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedMaximalTotalSupplyDelay()
        external
        onlyAdmin
        nonReentrant
    {
        _rollback(_maximalTotalSupplyDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function ratiosOracle() external view returns (address) {
        return address(uint160(_ratiosOracle.value));
    }

    /// @inheritdoc IVaultConfigurator
    function priceOracle() external view returns (address) {
        return address(uint160(_priceOracle.value));
    }

    /// @inheritdoc IVaultConfigurator
    function validator() external view returns (address) {
        return address(uint160(_validator.value));
    }

    /// @inheritdoc IVaultConfigurator
    function stageRatiosOracle(address oracle) external onlyAdmin nonReentrant {
        if (oracle == address(0)) revert AddressZero();
        _stage(_ratiosOracle, uint160(oracle));
    }

    /// @inheritdoc IVaultConfigurator
    function commitRatiosOracle() external onlyAdmin nonReentrant {
        _commit(_ratiosOracle, _ratiosOracleDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedRatiosOracle() external onlyAdmin nonReentrant {
        _rollback(_ratiosOracle);
    }

    /// @inheritdoc IVaultConfigurator
    function stagePriceOracle(address oracle) external onlyAdmin nonReentrant {
        if (oracle == address(0)) revert AddressZero();
        _stage(_priceOracle, uint160(oracle));
    }

    /// @inheritdoc IVaultConfigurator
    function commitPriceOracle() external onlyAdmin nonReentrant {
        _commit(_priceOracle, _priceOracleDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedPriceOracle() external onlyAdmin nonReentrant {
        _rollback(_priceOracle);
    }

    /// @inheritdoc IVaultConfigurator
    function stageValidator(
        address validator_
    ) external onlyAdmin nonReentrant {
        if (validator_ == address(0)) revert AddressZero();
        _stage(_validator, uint160(validator_));
    }

    /// @inheritdoc IVaultConfigurator
    function commitValidator() external onlyAdmin nonReentrant {
        _commit(_validator, _validatorDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedValidator() external onlyAdmin nonReentrant {
        _rollback(_validator);
    }

    /// @inheritdoc IVaultConfigurator
    function priceOracleDelay() external view returns (uint256) {
        return _priceOracleDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function ratiosOracleDelay() external view returns (uint256) {
        return _ratiosOracleDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function validatorDelay() external view returns (uint256) {
        return _validatorDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageValidatorDelay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_validatorDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitValidatorDelay() external onlyAdmin nonReentrant {
        _commit(_validatorDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedValidatorDelay() external onlyAdmin nonReentrant {
        _rollback(_validatorDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function stagePriceOracleDelay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_priceOracleDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitPriceOracleDelay() external onlyAdmin nonReentrant {
        _commit(_priceOracleDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedPriceOracleDelay() external onlyAdmin nonReentrant {
        _rollback(_priceOracleDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function stageRatiosOracleDelay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_ratiosOracleDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitRatiosOracleDelay() external onlyAdmin nonReentrant {
        _commit(_ratiosOracleDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedRatiosOracleDelay() external onlyAdmin nonReentrant {
        _rollback(_ratiosOracleDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function emergencyWithdrawalDelay() external view returns (uint256) {
        return _emergencyWithdrawalDelay.value;
    }

    /// @inheritdoc IVaultConfigurator
    function stageEmergencyWithdrawalDelay(
        uint256 delay_
    ) external onlyAdmin nonReentrant {
        if (delay_ > MAX_DELAY) revert InvalidDelay();
        _stage(_emergencyWithdrawalDelay, delay_);
    }

    /// @inheritdoc IVaultConfigurator
    function commitEmergencyWithdrawalDelay() external onlyAdmin nonReentrant {
        _commit(_emergencyWithdrawalDelay, _baseDelay);
    }

    /// @inheritdoc IVaultConfigurator
    function rollbackStagedEmergencyWithdrawalDelay()
        external
        onlyAdmin
        nonReentrant
    {
        _rollback(_emergencyWithdrawalDelay);
    }
}
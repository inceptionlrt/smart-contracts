// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

import "./Configurable.sol";
import "./interfaces/IFeeCollector.sol";

/**
 * @title MEV & Tips fee recipient
 * @author GenesisLRT
 * @notice Contract receives EL (tips/MEV) rewards and send them to RestakingPool
 */
contract FeeCollector is
    Configurable,
    ReentrancyGuardUpgradeable,
    IFeeCollector
{
    uint16 public constant MAX_COMMISSION = uint16(1e4); // 100.00

    uint16 public commission;

    /*******************************************************************************
                        CONSTRUCTOR
    *******************************************************************************/

    /// @dev https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#initializing_the_implementation_contract
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IProtocolConfig config,
        uint16 commission_
    ) public initializer {
        __ReentrancyGuard_init();
        __Configurable_init(config);
        __FeeCollector_init(commission_);
    }

    function __FeeCollector_init(uint16 commission_) internal onlyInitializing {
        _setCommission(commission_);
    }

    /*******************************************************************************
                        WRITE FUNCTIONS
    *******************************************************************************/

    /**
     * @dev receive implemented to receive MEV transfers.
     */
    receive() external payable {
        emit Received(_msgSender(), msg.value);
    }

    /**
     * @notice Withdraw collected rewards to pool and treasury.
     */
    function withdraw() external override nonReentrant {
        uint256 balance = address(this).balance;
        // min balance to withdraw is max commission
        if (balance >= MAX_COMMISSION) {
            (uint256 fee, uint256 rewardsWithoutCommission) = _takeFee(balance);

            address pool = address(config().getRestakingPool());
            address treasury = config().getTreasury();

            (bool success, ) = payable(pool).call{
                value: rewardsWithoutCommission
            }("");
            if (!success) {
                revert FeeCollectorTransferFailed(pool);
            }

            (success, ) = payable(treasury).call{value: fee}("");
            if (!success) {
                revert FeeCollectorTransferFailed(treasury);
            }

            emit Withdrawn(pool, treasury, rewardsWithoutCommission, fee);
        }
    }

    /*******************************************************************************
                        VIEW FUNCTIONS
    *******************************************************************************/

    /**
     * @notice Get collected pool rewards w/ fee.
     */
    function getRewards() external view returns (uint256 rewards) {
        (, rewards) = _takeFee(address(this).balance);
    }

    /**
     *
     * @dev Take fee from `amount`.
     */
    function _takeFee(
        uint256 amount
    ) internal view returns (uint256 fee, uint256 rewards) {
        fee = (amount * commission) / MAX_COMMISSION;
        rewards = amount - fee;
    }

    /*******************************************************************************
                        GOVERNANCE FUNCTIONS
    *******************************************************************************/

    function setCommission(uint16 newValue) external onlyGovernance {
        _setCommission(newValue);
    }

    function _setCommission(uint16 value) internal {
        if (value >= MAX_COMMISSION) {
            revert CommissionNotInRange();
        }

        emit CommissionChanged(commission, value);
        commission = value;
    }
}

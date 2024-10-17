// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbRetryableTx.sol";
import "./AbstractCrossChainAdapterL2.sol";

/**
 * @author The InceptionLRT team
 * @title CrossChainAdapterArbitrumL2
 * @dev Implementation of the L2 cross-chain adapter for Arbitrum.
 * This contract is responsible for sending assets and ETH from Arbitrum L2 to L1.
 */
contract CrossChainAdapterArbitrumL2 is AbstractCrossChainAdapterL2 {
    event ArbSysChanged(address indexed prevArbSys, address indexed newArbSys);
    event RetryableTicketCreated(uint256 indexed retryableTicketId);
    // event RedemptionFailed(uint256 indexed retryableTicketId); // TODO: guess gonna clean it later

    /// @notice Arbitrum system contract (ArbSys).
    ArbSys arbsys;
    ArbRetryableTx arbRetryableTx;

    /**
     * @notice Initializes the contract with the L1 target and operator addresses. Sets the default ArbSys address.
     * @param _l1Target Address of the L1 target contract.
     * @param _operator Address of the operator.
     */
    function initialize(
        address _l1Target,
        address _operator
    ) public initializer {
        __AbstractCrossChainAdapterL1_init(_l1Target, _msgSender(), _operator);
        arbsys = ArbSys(address(100)); // ArbSys precompile
        arbRetryableTx = ArbRetryableTx(
            address(0x000000000000000000000000000000000000006E)
        ); // ArbRetryableTx precompile
    }

    /**
     * @notice Sends token and ETH balance information from L2 to L1.
     * @param _tokensAmount The amount of tokens to send to L1.
     * @param _ethAmount The amount of ETH to send to L1.
     * @return success True if the message was successfully sent.
     *
     * Emits an {RetryableTicketCreated} event on success.
     */
    function sendAssetsInfoToL1(
        uint256 _tokensAmount,
        uint256 _ethAmount,
        bytes[] calldata
    ) external payable override onlyVault returns (bool success) {
        require(l1Target != address(0), L1TargetNotSet());

        // Encode the data for sending the assets info to L1
        bytes memory data = abi.encodeWithSignature(
            "receiveL2Info(uint256,uint256,uint256)",
            block.timestamp,
            _tokensAmount,
            _ethAmount
        );

        // Send transaction to L1 via ArbSys precompile
        uint256 withdrawalId = arbsys.sendTxToL1{value: msg.value}(
            l1Target,
            data
        );

        emit RetryableTicketCreated(withdrawalId);

        return true;
    }

    /**
     * @notice Sends ETH from L2 to L1. Empty parameters are reserved for future L2 Implementations.
     * @return success True if the ETH was successfully sent.
     *
     * Emits an {RetryableTicketCreated} event on success.
     *
     * Reverts if insufficient ETH is sent or the L1 target is not set.
     */
    function sendEthToL1(
        uint256,
        bytes[] calldata
    ) external payable override onlyVault returns (bool success) {
        require(l1Target != address(0), L1TargetNotSet());

        uint256 withdrawalId = arbsys.withdrawEth{value: msg.value}(l1Target);

        emit RetryableTicketCreated(withdrawalId);

        return true;
    }

    /**
     * @notice Used mainly for testing purposes. Should unlikely be called on the Mainnet.
     * @param _newArbSys new ArbSys address
     */
    function setArbSys(address _newArbSys) external onlyOwner {
        require(_newArbSys != address(0), SettingZeroAddress());
        emit ArbSysChanged(address(arbsys), _newArbSys);
        arbsys = ArbSys(_newArbSys);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "../interfaces/ICrossChainAdapter.sol";
import "../interfaces/IRestakingPool.sol";
import "../TransactionStorage.sol";

contract MockCrossChainAdapter is ICrossChainAdapter {
    TransactionStorage public transactionStorage;
    IRestakingPool public restakingPool;

    uint32[] public chainIds;
    address public owner;
    uint256 public constant ARBITRUM_CHAIN_ID = 42161;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(address _transactionStorage, address _restakingPool) {
        require(
            _transactionStorage != address(0),
            "Invalid TransactionStorage address"
        );
        require(_restakingPool != address(0), "Invalid RestakingPool address");

        transactionStorage = TransactionStorage(_transactionStorage);
        restakingPool = IRestakingPool(_restakingPool);
        owner = msg.sender;
    }

    function receiveL2Info(
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external override {
        if (_timestamp > block.timestamp) {
            revert FutureTimestamp();
        }

        transactionStorage.handleL2Info(
            ARBITRUM_CHAIN_ID,
            _timestamp,
            _balance,
            _totalSupply
        );

        emit L2InfoReceived(
            ARBITRUM_CHAIN_ID,
            _timestamp,
            _balance,
            _totalSupply
        );
    }

    function receiveL2Eth() external payable override {
        require(msg.value > 0, "No ETH received");

        // Forward the received ETH to the Restaking Pool contract
        restakingPool.stake{value: msg.value}();

        emit L2EthReceived(msg.value);
    }

    receive() external payable {
        // Resend ETH to the restaking pool when received via fallback
        if (msg.value > 0) {
            restakingPool.stake{value: msg.value}();
            emit L2EthReceived(msg.value);
        }
    }
}

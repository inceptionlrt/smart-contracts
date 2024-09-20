// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interface/ICrossChainAdapter.sol";
import "../interface/ITransactionStorage.sol";

abstract contract AbstractCrossChainAdapter is Ownable, ICrossChainAdapter {
    address public l2Target;
    address public rebalancer;
    address public transactionStorage;

    event L2EthDeposit(uint256 amount);

    constructor(address _transactionStorage) {
        transactionStorage = _transactionStorage;
    }

    function setRebalancer(address _rebalancer) external virtual onlyOwner {
        require(_rebalancer != address(0), SettingZeroAddress());
        rebalancer = _rebalancer;
    }

    function updateL2Target(address _l2Target) external virtual onlyOwner {
        require(_l2Target != address(0), SettingZeroAddress());
        l2Target = _l2Target;
    }

    function receiveL2Eth() external payable virtual {
        require(rebalancer != address(0), RebalancerNotSet());
        require(transactionStorage != address(0), TxStorageNotSet());
        (bool success, ) = rebalancer.call{value: msg.value}("");
        require(success, TransferToRebalancerFailed());
        emit L2EthDeposit(msg.value);
    }

    function handleL2Info(
        uint256 _chainId,
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) internal {
        require(rebalancer != address(0), RebalancerNotSet());
        require(transactionStorage != address(0), TxStorageNotSet());
        require(_timestamp <= block.timestamp, FutureTimestamp());

        ITransactionStorage(transactionStorage).handleL2Info(
            _chainId,
            _timestamp,
            _balance,
            _totalSupply
        );
    }
}

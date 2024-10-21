// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IRebalancer {
    // Events
    event ETHReceived(address sender, uint256 amount);
    event ETHDepositedToLiquidPool(address liquidPool, uint256 amountETH);
    event InETHDepositedToLockbox(uint256 mintAmount);

    // Functions
    function initialize(
        address _inETHAddress,
        address _lockbox,
        address payable _liqPool,
        address _transactionStorage,
        address _ratioFeed
    ) external;

    function setTransactionStorage(address _transactionStorage) external;

    function setInETHAddress(address _inETHAddress) external;

    function setLockboxAddress(address _lockboxAddress) external;

    function setLiqPool(address payable _liqPool) external;

    function updateTreasuryData() external;

    function getRatioL2(
        uint256 _tokenAmount,
        uint256 _ethAmount
    ) external pure returns (uint256);
}

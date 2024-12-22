// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInceptionErrors {
    error OnlyMinterAllowed();

    error IsPaused();
    error NotPaused();
    error TransferIsPaused();
}

interface IInceptionToken {
    event VaultChanged(address prevValue, address newValue);
    event RebalancerChanged(address prevValue, address newValue);

    event Paused(address account);
    event Unpaused(address account);

    function mint(address account, uint256 amount) external;

    function burn(address account, uint256 amount) external;
}

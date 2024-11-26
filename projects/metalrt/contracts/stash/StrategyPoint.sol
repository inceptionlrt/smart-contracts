// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.18;

// import "./AdapterBase.sol";
// contract PointAdapter is AdapterBase {
//     address public preDepositContract;

//     constructor(address _preDepositContract, address _asset) AdapterBase(_asset) {
//         preDepositContract = _preDepositContract;
//     }

//     function deposit(uint256 amount) external override {
//         // Route deposit to pre-deposit contract
//         (bool success,) = preDepositContract.call{value: amount}("");
//         require(success, "Deposit failed");
//     }

//     function withdraw(uint256 amount) external override {
//         (bool success,) = preDepositContract.call(abi.encodeWithSignature("withdraw(uint256)", amount));
//         require(success, "Withdraw failed");
//     }
// }
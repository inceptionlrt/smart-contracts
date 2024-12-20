// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
//import {Origin, MessagingReceipt, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

interface IMultiERC20LZAdapterL2 {
//    function setAuthVault(address _iov, bool _access) external;
//    function setBridgeForAsset(address _asset, address _bridge) external;
    function reportHoldings(address _asset, uint256 _incSupply, uint256 _assetBalance) external;
//    function sendToL1(bytes calldata _options) external payable;
    function prepareBridging(address _asset, uint256 _amount) external;
//    function executeBridging() external;

//    function quoteSendToL1(bytes calldata _options) external view returns (uint256);
}
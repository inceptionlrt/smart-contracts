// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IMellowSymbioticVault} from "../interfaces/symbiotic-vault/mellow-core/IMellowSymbioticVault.sol";
import {IClaimer} from "../interfaces/symbiotic-vault/mellow-core/IClaimer.sol";

interface IWithdrawalQueueERC721 {
    function requestWithdrawalsWstETH(uint256[] calldata _amounts, address _owner) external returns (uint256[] memory requestIds);
    function claimWithdrawal(uint256 _requestId) external;
    function WSTETH() external view returns (address);
}

contract MellowV3AdapterClaimer {
    using SafeERC20 for IERC20;

    address internal immutable adapter;

    constructor(address asset) {
        adapter = msg.sender;
        IERC20(asset).approve(adapter, type(uint256).max);
    }

    function claim(
        address mellowClaimer,
        address multiVault,
        uint256[] calldata subvaultIndices,
        uint256[][] calldata indices,
        address recipient,
        uint256 maxAssets
    ) external returns (uint256) {
        require(msg.sender == adapter);
        return IClaimer(mellowClaimer).multiAcceptAndClaim(
            multiVault, subvaultIndices, indices, recipient, maxAssets
        );
    }

    function requestWithdrawalsWstETH(
        address withdrawalQueue, uint256 balance
    ) external returns (uint256[] memory requestIds) {
        require(msg.sender == adapter);

        uint256[] memory _amounts = new uint256[](1);
        _amounts[0] = balance;

        IERC20(
            IWithdrawalQueueERC721(withdrawalQueue).WSTETH()
        ).safeIncreaseAllowance(withdrawalQueue, balance);

        return IWithdrawalQueueERC721(withdrawalQueue).requestWithdrawalsWstETH(_amounts, address(this));
    }
}
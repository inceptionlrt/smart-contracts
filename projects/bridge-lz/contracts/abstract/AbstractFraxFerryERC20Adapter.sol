// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IFraxFerry} from "../interfaces/IFraxFerry.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IFraxFerryERC20Bridge} from "../interfaces/IFraxFerryERC20Bridge.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title AbstractFraxFerryERC20Adapter
 * @author InceptionLRT
 * @dev This abstract contract provides functionality for transfers of ERC20 tokens between networks
 * by the means of FraxFerry.
 * This contract is intended to be inherited by contracts implementing specific cross-chain bridge logic.
 */
abstract contract AbstractFraxFerryERC20Adapter is IFraxFerryERC20Bridge {
    IFraxFerry ferry;
    IERC20 token;
    address erc20OtherChainDestination;

/*
    function _approveFerry(uint256 approvalAmount) internal returns (bool) {
        return token.approve(address(ferry), approvalAmount);
    }
*/
    function sendTokensViaFerry(uint256 amount) external {
        ferry.embarkWithRecipient(amount, erc20OtherChainDestination);
    }

    function quoteSendTokens(uint256 amount) external view returns (uint256) {
        return Math.min(Math.max(ferry.FEE_MIN(),amount*ferry.FEE_RATE()/10000),ferry.FEE_MAX());
    }
}
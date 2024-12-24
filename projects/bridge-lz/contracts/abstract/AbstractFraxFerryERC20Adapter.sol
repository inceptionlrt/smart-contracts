// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IFraxFerry} from "../interfaces/IFraxFerry.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20CrossChainBridge} from "../interfaces/IERC20CrossChainBridge.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AbstractFraxFerryERC20Adapter
 * @author InceptionLRT
 * @dev This abstract contract provides functionality for transfers of ERC20 tokens between networks
 * by the means of FraxFerry.
 * This contract is intended to be inherited by contracts implementing specific cross-chain bridge logic.
 */
abstract contract AbstractFraxFerryERC20Adapter is IERC20CrossChainBridge {
    using SafeERC20 for IERC20;

    IFraxFerry ferry;
    IERC20 token;
    address erc20OtherChainDestination;

    error errDestinationNotSet();
    event DestinationChanged(address destination);
    event FerryChanged(address ferry);
    function sendTokens(uint256 amount) external {
        if(erc20OtherChainDestination == address(0)) revert errDestinationNotSet();
        // pull tokens from msg.sender (we already have approval from the vault)
        token.safeTransferFrom(msg.sender, address(this), amount);
        // approve the ferry to draw tokens
        token.forceApprove(address(ferry), amount);
        // embark
        ferry.embarkWithRecipient(amount, erc20OtherChainDestination);
        // send back whatever wasn't taken by ferry
        uint256 bal = token.balanceOf(address(this));
        if (bal != 0) {
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
        }
    }

    function quoteSendTokens(uint256 amount) external view returns (uint256) {
        return Math.min(Math.max(ferry.FEE_MIN(),amount*ferry.FEE_RATE()/10000),ferry.FEE_MAX());
    }

}

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

    IFraxFerry public ferry;
    IERC20 public token;
    address public erc20DestinationChain;

    /// TODO: Why are they here?
    error errDestinationNotSet();
    event DestinationChanged(address destination);
    event FerryChanged(address ferry);
    event DustReturnedToVault(uint256 amount);

    function sendTokens(uint256 amount) external returns (uint256) {
        require(erc20DestinationChain != address(0), errDestinationNotSet());

        address vault = msg.sender;
        // pull tokens from msg.sender (we already have approval from the vault)
        token.safeTransferFrom(vault, address(this), amount);
        // approve the ferry to draw tokens
        /// TODO: forceApprove ?
        token.forceApprove(address(ferry), amount);
        ferry.embarkWithRecipient(amount, erc20DestinationChain);
        // send back whatever wasn't taken by ferry
        uint256 bal = token.balanceOf(address(this));
        if (bal == 0) return 0;

        token.safeTransfer(vault, bal);
        emit DustReturnedToVault(bal);

        return bal;
    }

    function quoteSendTokens(uint256 amount) external view returns (uint256) {
        return
            Math.min(
                Math.max(ferry.FEE_MIN(), (amount * ferry.FEE_RATE()) / 10000),
                ferry.FEE_MAX()
            );
    }
}

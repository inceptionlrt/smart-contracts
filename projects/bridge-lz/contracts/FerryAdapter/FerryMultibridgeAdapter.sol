// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;
import {IGenericERC20Bridge} from "../interfaces/IGenericERC20Bridge.sol";
import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IFraxFerry} from "../interfaces/IFraxFerry.sol";

contract FerryMultibridgeAdapter is IGenericERC20Bridge {

    using SafeERC20 for IERC20;

    IERC20 token;
    IFraxFerry ferry;

    constructor(address _token, address _ferry) {
        token = IERC20(_token);
        ferry = IFraxFerry(_ferry);
    }

    function bridge(address receiver, uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        token.forceApprove(address(ferry), amount);
        ferry.embarkWithRecipient(amount, receiver);
    }
}
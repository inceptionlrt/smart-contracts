// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Mock InETH Token for testing
 * @dev ERC20 token that allows the owner to mint new tokens.
 */
contract MockERC20Token is ERC20, Ownable {
    constructor() ERC20("Mock InETH Token", "InETHmock") Ownable(msg.sender) {}

    /**
     * @dev Function that allows the owner to mint new tokens.
     * @param to The address to receive the newly minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import {IInceptionAirdrop} from "./interface/IInceptionAirdrop.sol";

/**
 * @author InceptionLRT V2
 * @title InceptionAirdrop
 * @notice Serves the Eigen Token Airdrop within InceptionLRT's users.
 */
contract InceptionAirdrop is
    OwnableUpgradeable,
    PausableUpgradeable,
    IInceptionAirdrop
{
    using SafeERC20 for IERC20;

    IERC20 public token;

    address public operator;

    /// @dev Stores balances for each recipient
    mapping(address => uint256) public airdropBalances;

    /// @dev Tracks which addresses have claimed their airdrop
    mapping(address => bool) public claimed;

    modifier onlyOperator() {
        if (msg.sender != operator) revert OnlyOperatorAllowed();
        _;
    }

    function initialize(
        address initialOwner,
        address newOperator,
        IERC20 _token
    ) external initializer {
        __Ownable_init(initialOwner);

        token = _token;
        emit TokenChanged(address(0), address(_token));

        operator = newOperator;
        emit OperatorChanged(address(0), newOperator);
    }

    /// @dev users can claim their airdrop
    function claimAirdrop() external whenNotPaused {
        if (claimed[msg.sender]) revert AirdropAlreadyClaimed();

        uint256 amount = airdropBalances[msg.sender];
        if (amount == 0) revert NoAirdropAvailable();

        claimed[msg.sender] = true;

        // Transfer the tokens to the user
        if (!token.transfer(msg.sender, amount)) revert TokenTransferFailed();

        emit AirdropClaimed(msg.sender, amount);
    }

    // Batch update function for the admin to update unclaimed airdrop balances
    function updateAirdrop(
        address[] calldata recipients,
        uint256[] calldata newBalances
    ) external onlyOwner {
        if (recipients.length != newBalances.length)
            revert ArrayLengthsMismatch();

        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 newBalance = newBalances[i];
            claimed[recipient] = false;

            emit AirdropUpdated(
                recipient,
                airdropBalances[recipient],
                newBalance
            );
            airdropBalances[recipient] = newBalance;
        }
    }

    function setAirdropBalances(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOperator {
        if (recipients.length != amounts.length) revert ArrayLengthsMismatch();

        for (uint256 i = 0; i < recipients.length; i++) {
            if (airdropBalances[recipients[i]] == 0) {
                airdropBalances[recipients[i]] = amounts[i];
            }
        }
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        if (!token.transfer(msg.sender, amount)) revert TokenTransferFailed();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev selfBalance returns the current balance of the Airdrop pool (this contract)
    function selfBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}

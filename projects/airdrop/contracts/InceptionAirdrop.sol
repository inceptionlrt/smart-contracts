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
        require(msg.sender == operator, OnlyOperatorAllowed());
        _;
    }

    function initialize(
        address initialOwner,
        address newOperator,
        IERC20 _token
    ) external initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();

        token = _token;
        emit TokenChanged(address(0), address(_token));

        operator = newOperator;
        emit OperatorChanged(address(0), newOperator);
    }

    /// @notice Allows the owner to change the operator address.
    /// @param newOperator The new operator address.
    function setOperator(address newOperator) external onlyOwner {
        require(newOperator != address(0), NewOperatorZeroAddress());
        emit OperatorChanged(operator, newOperator);
        operator = newOperator;
    }

    /// @dev users can claim their airdrop
    function claimAirdrop() external whenNotPaused {
        require(!claimed[msg.sender], AirdropAlreadyClaimed());

        uint256 amount = airdropBalances[msg.sender];
        require(amount != 0, NoAirdropAvailable());

        claimed[msg.sender] = true;

        // Transfer the tokens to the user
        require(token.transfer(msg.sender, amount), TokenTransferFailed());

        emit AirdropClaimed(msg.sender, amount);
    }

    // Batch update function for the admin to update unclaimed airdrop balances
    function updateAirdrop(
        address[] calldata recipients,
        uint256[] calldata newBalances
    ) external onlyOwner {
        require(
            recipients.length == newBalances.length,
            ArrayLengthsMismatch()
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            claimed[recipients[i]] = false;

            emit AirdropUpdated(
                recipients[i],
                airdropBalances[recipients[i]],
                newBalances[i]
            );
            airdropBalances[recipients[i]] = newBalances[i];
        }
    }

    function setAirdropBalances(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOperator {
        require(recipients.length == amounts.length, ArrayLengthsMismatch());

        for (uint256 i = 0; i < recipients.length; i++) {
            if (airdropBalances[recipients[i]] == 0) {
                airdropBalances[recipients[i]] = amounts[i];
            }
        }
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(token.transfer(msg.sender, amount), TokenTransferFailed());
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

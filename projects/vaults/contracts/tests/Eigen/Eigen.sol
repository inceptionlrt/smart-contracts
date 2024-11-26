// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.12;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Eigen is OwnableUpgradeable, ERC20Upgradeable {
    /// CONSTANTS & IMMUTABLES
    /// @notice the address of the backing Eigen token bEIGEN
    IERC20 public immutable bEIGEN;

    /// STORAGE
    /// @notice mapping of minter addresses to the timestamp after which they are allowed to mint
    mapping(address => uint256) public mintAllowedAfter;
    /// @notice mapping of minter addresses to the amount of tokens they are allowed to mint
    mapping(address => uint256) public mintingAllowance;

    /// @notice the timestamp after which transfer restrictions are disabled
    uint256 public transferRestrictionsDisabledAfter;
    /// @notice mapping of addresses that are allowed to transfer tokens to any address
    mapping(address => bool) public allowedFrom;
    /// @notice mapping of addresses that are allowed to receive tokens from any address
    mapping(address => bool) public allowedTo;

    /// @notice event emitted when the allowedFrom status of an address is set
    event SetAllowedFrom(address indexed from, bool isAllowedFrom);
    /// @notice event emitted when the allowedTo status of an address is set
    event SetAllowedTo(address indexed to, bool isAllowedTo);
    /// @notice event emitted when a minter mints
    event Mint(address indexed minter, uint256 amount);
    /// @notice event emitted when the transfer restrictions disabled
    event TransferRestrictionsDisabled();

    constructor(IERC20 _bEIGEN) {
        bEIGEN = _bEIGEN;
        _disableInitializers();
    }

    /**
     * @notice An initializer function that sets initial values for the contract's state variables.
     * @param minters the addresses that are allowed to mint
     * @param mintingAllowances the amount of tokens that each minter is allowed to mint
     */
    function initialize(
        address initialOwner,
        address[] memory minters,
        uint256[] memory mintingAllowances,
        uint256[] memory mintAllowedAfters
    ) public initializer {
        __Ownable_init(initialOwner);
        __ERC20_init("Eigen", "EIGEN");
        _transferOwnership(initialOwner);

        require(
            minters.length == mintingAllowances.length,
            "Eigen.initialize: minters and mintingAllowances must be the same length"
        );
        require(
            minters.length == mintAllowedAfters.length,
            "Eigen.initialize: minters and mintAllowedAfters must be the same length"
        );
        // set minting allowances for each minter
        for (uint256 i = 0; i < minters.length; i++) {
            mintingAllowance[minters[i]] = mintingAllowances[i];
            mintAllowedAfter[minters[i]] = mintAllowedAfters[i];
            // allow each minter to transfer tokens
            allowedFrom[minters[i]] = true;
            emit SetAllowedFrom(minters[i], true);
        }

        // set transfer restrictions to be disabled at type(uint256).max to be set down later
        transferRestrictionsDisabledAfter = type(uint256).max;
    }

    /**
     * @notice This function allows the owner to set the allowedFrom status of an address
     * @param from the address whose allowedFrom status is being set
     * @param isAllowedFrom the new allowedFrom status
     */
    function setAllowedFrom(
        address from,
        bool isAllowedFrom
    ) external onlyOwner {
        allowedFrom[from] = isAllowedFrom;
        emit SetAllowedFrom(from, isAllowedFrom);
    }

    /**
     * @notice This function allows the owner to set the allowedTo status of an address
     * @param to the address whose allowedTo status is being set
     * @param isAllowedTo the new allowedTo status
     */
    function setAllowedTo(address to, bool isAllowedTo) external onlyOwner {
        allowedTo[to] = isAllowedTo;
        emit SetAllowedTo(to, isAllowedTo);
    }

    /**
     * @notice Allows the owner to disable transfer restrictions
     */
    function disableTransferRestrictions() external onlyOwner {
        require(
            transferRestrictionsDisabledAfter == type(uint256).max,
            "Eigen.disableTransferRestrictions: transfer restrictions are already disabled"
        );
        transferRestrictionsDisabledAfter = 0;
        emit TransferRestrictionsDisabled();
    }

    /**
     * @notice This function allows minter to mint tokens
     */
    function mint() external {
        require(
            mintingAllowance[msg.sender] > 0,
            "Eigen.mint: msg.sender has no minting allowance"
        );
        require(
            block.timestamp > mintAllowedAfter[msg.sender],
            "Eigen.mint: msg.sender is not allowed to mint yet"
        );
        uint256 amount = mintingAllowance[msg.sender];
        mintingAllowance[msg.sender] = 0;
        _mint(msg.sender, amount);
        emit Mint(msg.sender, amount);
    }

    /**
     * @notice This function allows bEIGEN holders to wrap their tokens into Eigen
     */
    function wrap(uint256 amount) external {
        require(
            bEIGEN.transferFrom(msg.sender, address(this), amount),
            "Eigen.wrap: bEIGEN transfer failed"
        );
        _transfer(address(this), msg.sender, amount);
    }

    /**
     * @notice This function allows Eigen holders to unwrap their tokens into bEIGEN
     */
    function unwrap(uint256 amount) external {
        _transfer(msg.sender, address(this), amount);
        require(
            bEIGEN.transfer(msg.sender, amount),
            "Eigen.unwrap: bEIGEN transfer failed"
        );
    }

    /**
     * @notice Allows the sender to transfer tokens to multiple addresses in a single transaction
     */
    function multisend(
        address[] calldata receivers,
        uint256[] calldata amounts
    ) public {
        require(
            receivers.length == amounts.length,
            "Eigen.multisend: receivers and amounts must be the same length"
        );
        for (uint256 i = 0; i < receivers.length; i++) {
            _transfer(msg.sender, receivers[i], amounts[i]);
        }
    }

    /**
     * @notice Updates the transfer of tokens to enforce transfer restrictions.
     * @param from the address tokens are being transferred from
     * @param to the address tokens are being transferred to
     * @param amount the amount of tokens being transferred
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // If transfer restrictions are enabled
        if (block.timestamp <= transferRestrictionsDisabledAfter) {
            // Check if both `from` and `to` are whitelisted or involve the contract address
            require(
                from == address(0) ||
                    from == address(this) ||
                    to == address(this) ||
                    allowedFrom[from] ||
                    allowedTo[to],
                "Eigen._update: from or to must be whitelisted"
            );
        }

        // Call the parent contract's `_update` logic for token transfer
        super._update(from, to, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/access/IAccessControlEnumerable.sol";

/// @notice This is a default access control with 3 roles:
///
/// - ADMIN: allowed to do anything
/// - ADMIN_DELEGATE: allowed to do anything except assigning ADMIN and ADMIN_DELEGATE roles
/// - OPERATOR: low-privileged role, generally keeper or some other bot
interface IDefaultAccessControl is IAccessControlEnumerable {
    error Forbidden();
    error AddressZero();

    function OPERATOR() external view returns (bytes32);

    function ADMIN_ROLE() external view returns (bytes32);

    function ADMIN_DELEGATE_ROLE() external view returns (bytes32);

    /// @notice Checks that the address is contract admin.
    /// @param who Address to check
    /// @return `true` if who is admin, `false` otherwise
    function isAdmin(address who) external view returns (bool);

    /// @notice Checks that the address is contract admin.
    /// @param who Address to check
    /// @return `true` if who is operator, `false` otherwise
    function isOperator(address who) external view returns (bool);

    /// @notice Checks that the address is contract admin.
    /// @param who Address to check
    /// @dev throws Forbbiden() if the sender does not have the admin or admin_delegate role
    function requireAdmin(address who) external view;

    /// @notice Checks that the address is contract admin.
    /// @param who Address to check
    /// @dev throws Forbbiden() if the sender has no roles
    function requireAtLeastOperator(address who) external view;
}
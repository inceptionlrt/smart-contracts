// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ProxyAdminMock {
    function upgradeAndCall(
        address proxy,
        address implementation,
        bytes memory data
    ) external payable {}
}

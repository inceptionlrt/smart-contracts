// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ProxyAdminMock {
    function upgrade(address proxy, address implementation) external payable {}
}

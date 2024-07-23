// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";

contract SimpleBeacon is IBeacon {
    address public implementation;

    constructor(address implementation_) {
        implementation = implementation_;
    }

    function upgradeTo(address implementation) external {}
}

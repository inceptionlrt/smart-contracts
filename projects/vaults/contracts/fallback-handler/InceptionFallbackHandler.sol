// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "hardhat/console.sol";

contract InceptionFallbackHandler {
    function _fallback(address facet) internal {
        require(facet != address(0), "facet address is zero");

        bytes memory resultData;
        assembly {
            // copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // get any return value
            returndatacopy(0, 0, returndatasize())
            // return any return value or error back to the caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                // resultData := mload(0)
            }
        }
    }
}

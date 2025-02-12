// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ERC4626Facet_EL} from "./ERC4626Facet_EL.sol";

/**
 * @title The ERC4626Facet_EL_E1 contract
 * @author The InceptionLRT team
 */
contract ERC4626Facet_EL_E1 is ERC4626Facet_EL {
    constructor() payable {}

    function _getAssetWithdrawAmount(
        uint256 amount
    ) internal pure override returns (uint256) {
        return amount + 1;
    }

    function _getAssetReceivedAmount(
        uint256 amount
    ) internal pure override returns (uint256) {
        return amount - 1;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ICrossChainBridgeL2} from "../interfaces/AdapterLayer2/ICrossChainBridgeL2.sol";
import {AbstractCrossChainAdapter} from "./AbstractCrossChainAdapter.sol";

/**
 * @title AbstractCrossChainAdapterL2
 * @dev This abstract contract is a placeholder for Layer 2 cross-chain bridge functionality. It extends
 * `AbstractCrossChainAdapter` and implements `ICrossChainBridgeL2`, serving as a placeholder for functionalities of Layer 2
 * cross-chain adapters.
 */

abstract contract AbstractCrossChainAdapterL2 is
    AbstractCrossChainAdapter,
    ICrossChainBridgeL2
{
    //EMPTY... for now
}

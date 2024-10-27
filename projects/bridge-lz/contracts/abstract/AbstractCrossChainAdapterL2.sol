// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import { ICrossChainBridgeL2 } from "../interfaces/ICrossChainBridgeL2.sol";
import { AbstractCrossChainAdapter } from "./AbstractCrossChainAdapter.sol";

/**
 * @title AbstractCrossChainAdapter
 * @author InceptionLRT
 * @dev TODO
 */
abstract contract AbstractCrossChainAdapterL2 is AbstractCrossChainAdapter, ICrossChainBridgeL2 {
    //EMPTY... for now
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IEigenPodManager.sol";

interface IRestakerFacets {
    error ZeroAddress();

    event SignatureSet(FuncTarget indexed target, bytes4 signature);

    enum FuncTarget {
        POD,
        POD_MANAGER,
        DELEGATION_MANAGER
    }

    function selectorToTarget(bytes4 sig) external view returns (address);

    function getEigenPodManager() external view returns (IEigenPodManager);

    function getDelegationManager() external view returns (IDelegationManager);
}

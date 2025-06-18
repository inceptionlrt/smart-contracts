// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.28;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface IMultiVaultStorage {
    enum Protocol {
        SYMBIOTIC,
        EIGEN_LAYER,
        ERC4626
    }

    struct Subvault {
        Protocol protocol;
        address vault;
        address withdrawalQueue;
    }

    struct RewardData {
        address distributionFarm;
        address curatorTreasury;
        address token;
        uint256 curatorFeeD6;
        Protocol protocol;
        bytes data;
    }

    struct MultiStorage {
        address depositStrategy;
        address withdrawalStrategy;
        address rebalanceStrategy;
        Subvault[] subvaults;
        mapping(address subvault => uint256 index) indexOfSubvault;
        mapping(uint256 id => RewardData) rewardData;
        EnumerableSet.UintSet farmIds;
        address defaultCollateral;
        address symbioticAdapter;
        address eigenLayerAdapter;
        address erc4626Adapter;
        bytes32[16] _gap;
    }

    function subvaultsCount() external view returns (uint256);

    function subvaultAt(uint256 index) external view returns (Subvault memory);

    function indexOfSubvault(address subvault) external view returns (uint256);

    function farmIds() external view returns (uint256[] memory);

    function farmCount() external view returns (uint256);

    function farmIdAt(uint256 index) external view returns (uint256);

    function farmIdsContains(uint256 farmId) external view returns (bool);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {BeaconProxy, Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "./InceptionVaultStorage_EL.sol";

import "hardhat/console.sol";

/// @author The InceptionLRT team
/// @title The InceptionVault_EL contract
/// @notice Aims to maximize the profit of EigenLayer for a certain asset.
contract InceptionVault_EL is InceptionVaultStorage_EL {
    enum FuncTarget {
        SETTER_FACET,
        EIGEN_LAYER_FACET,
        ERC4626_FACET
    }

    enum FuncAccess {
        EVERYONE,
        ONLY_OPERATOR,
        ONLY_OWNER
    }

    struct FuncData {
        FuncTarget facet;
        FuncAccess access;
    }

    mapping(bytes4 => FuncData) internal _selectorToTarget;

    function __InceptionVault_init(
        string memory vaultName,
        address operatorAddress,
        IStrategyManager _strategyManager,
        IInceptionToken _inceptionToken,
        IStrategy _assetStrategy
    ) internal {
        __Ownable_init();
        __EigenLayerHandler_init(_strategyManager, _assetStrategy);

        name = vaultName;
        _operator = operatorAddress;
        inceptionToken = _inceptionToken;

        minAmount = 100;

        protocolFee = 50 * 1e8;

        /// @dev deposit bonus
        depositUtilizationKink = 25 * 1e8;
        maxBonusRate = 15 * 1e7;
        optimalBonusRate = 25 * 1e6;

        /// @dev withdrawal fee
        withdrawUtilizationKink = 25 * 1e8;
        maxFlashFeeRate = 30 * 1e7;
        optimalWithdrawalRate = 5 * 1e7;

        treasury = msg.sender;
    }

    /*//////////////////////////////
    ////// Factory functions //////
    ////////////////////////////*/

    function __EigenLayerHandler_init(
        IStrategyManager _strategyManager,
        IStrategy _assetStrategy
    ) internal onlyInitializing {
        strategyManager = _strategyManager;
        strategy = _assetStrategy;

        __InceptionAssetsHandler_init(_assetStrategy.underlyingToken());
        // approve spending by strategyManager
        if (!_asset.approve(address(strategyManager), type(uint256).max))
            revert ApproveError();
    }

    /*//////////////////////////
    ////// SET functions //////
    ////////////////////////*/

    function setEigenLayerFacet(address newEigenLayerFacet) external {
        eigenLayerFacet = newEigenLayerFacet;
    }

    function setUserOperationFacet(address newUserOperationFacet) external {
        userOperationFacet = newUserOperationFacet;
    }

    function setSetterFacet(address newSetterFacet) external {
        setterFacet = newSetterFacet;
    }

    fallback() external {
        (address target, FuncAccess access) = _getSelectorToTarget(msg.sig);
        require(target != address(0));
        _verifyAccess(access);
        assembly {
            // copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // execute function call using the facet
            let result := delegatecall(gas(), target, 0, calldatasize(), 0, 0)
            // get any return value
            returndatacopy(0, 0, returndatasize())
            // return any return value or error back to the caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                //    resultData := mload(0)
            }
        }
    }

    /// TODO
    function setSignature(
        bytes4 sig,
        FuncTarget _target,
        FuncAccess _access
    ) external {
        // FuncData storage data =
        _selectorToTarget[sig] = FuncData({facet: _target, access: _access});
        //  emit SignatureSet(target, sig);
    }

    function _getSelectorToTarget(
        bytes4 sig
    ) internal view returns (address, FuncAccess) {
        _requireNotPaused();
        FuncData memory target = _selectorToTarget[sig];
        if (target.facet == FuncTarget.ERC4626_FACET) {
            return (userOperationFacet, target.access);
        }
        if (target.facet == FuncTarget.EIGEN_LAYER_FACET) {
            return (eigenLayerFacet, target.access);
        }
        if (target.facet == FuncTarget.SETTER_FACET) {
            return (setterFacet, target.access);
        }
        return (address(0), FuncAccess.EVERYONE);
    }

    function _verifyAccess(FuncAccess access) internal view {
        if (access == FuncAccess.ONLY_OWNER) {
            _checkOwner();
        } else if (access == FuncAccess.ONLY_OPERATOR) {
            if (msg.sender != _operator) revert OnlyOperatorAllowed();
        }
    }

    /*///////////////////////////////
    ////// Pausable functions //////
    /////////////////////////////*/

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

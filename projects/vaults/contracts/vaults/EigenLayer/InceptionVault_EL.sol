// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BeaconProxy, Address} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "./InceptionVaultStorage_EL.sol";

/**
 * @title The InceptionVault_EL contract
 * @notice Aims to maximize the profit of EigenLayer for a certain asset.
 * @author The InceptionLRT team
 */
contract InceptionVault_EL is InceptionVaultStorage_EL {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        string memory vaultName,
        address operatorAddress,
        IStrategyManager _strategyManager,
        IInceptionToken _inceptionToken,
        IStrategy _assetStrategy
    ) external initializer {
        __InceptionVault_init(
            vaultName,
            operatorAddress,
            _strategyManager,
            _inceptionToken,
            _assetStrategy
        );
    }

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

        /// rewards logic
        rewardsTimeline = 7 days;
    }

    function __EigenLayerHandler_init(
        IStrategyManager _strategyManager,
        IStrategy _assetStrategy
    ) internal onlyInitializing {
        strategyManager = _strategyManager;
        strategy = _assetStrategy;

        __InceptionVaultStorage_EL_init(_assetStrategy.underlyingToken());
        // approve spending by strategyManager
        if (!_asset.approve(address(strategyManager), type(uint256).max))
            revert ApproveError();
    }

    /*//////////////////////////
    ////// SET functions //////
    ////////////////////////*/

    function setEigenLayerFacet(address newEigenLayerFacet) external onlyOwner {
        if (!Address.isContract(newEigenLayerFacet)) revert NotContract();

        emit EigenLayerFacetChanged(eigenLayerFacet, newEigenLayerFacet);
        eigenLayerFacet = newEigenLayerFacet;
    }

    function setERC4626Facet(address newERC4626Facet) external onlyOwner {
        if (!Address.isContract(newERC4626Facet)) revert NotContract();

        emit ERC4626FacetChanged(erc4626Facet, newERC4626Facet);
        erc4626Facet = newERC4626Facet;
    }

    function setSetterFacet(address newSetterFacet) external onlyOwner {
        if (!Address.isContract(newSetterFacet)) revert NotContract();

        emit SetterFacetChanged(setterFacet, newSetterFacet);
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

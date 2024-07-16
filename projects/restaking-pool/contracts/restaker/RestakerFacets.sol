// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "../Configurable.sol";
import "../interfaces/IEigenPodManager.sol";
import "./IRestaker.sol";
import "./IRestakerFacets.sol";

/**
 * @title Facets of Restaker
 * @author GenesisLRT
 * @notice Stores the targets of method signatures.
 */
contract RestakerFacets is OwnableUpgradeable, IRestakerFacets {
    mapping(bytes4 => FuncTarget) internal _selectorToTarget;
    IEigenPodManager internal _podManager;
    IDelegationManager internal _delegationManager;

    /*******************************************************************************
                        CONSTRUCTOR
    *******************************************************************************/

    /// @dev https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#initializing_the_implementation_contract
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address owner,
        IEigenPodManager podManager,
        IDelegationManager delegationManager
    ) external initializer {
        __Ownable_init(owner);
        __RestakerFacets_init(podManager, delegationManager);
    }

    function __RestakerFacets_init(
        IEigenPodManager podManager,
        IDelegationManager delegationManager
    ) internal onlyInitializing {
        _requireNotZero(address(podManager));
        _requireNotZero(address(delegationManager));

        _podManager = podManager;
        _delegationManager = delegationManager;

        // NOTE: pod manager sigs added during first initialization, for new deployments must be added manually
        // _setSignature(FuncTarget.POD_MANAGER, "createPod()");
        // _setSignature(FuncTarget.POD_MANAGER, "stake(bytes,bytes,bytes32)");

        // NOTE: delegation manager sigs added during first initialization, for new deployments must be added manually
        // _setSignature(FuncTarget.DELEGATION_MANAGER, "undelegate(address)");
        // _setSignature(
        //     FuncTarget.DELEGATION_MANAGER,
        //     "queueWithdrawals((address[],uint256[],address)[])"
        // );
        // _setSignature(
        //     FuncTarget.DELEGATION_MANAGER,
        //     "delegateTo(address,(bytes,uint256),bytes32)"
        // );
    }

    function setSignature(
        FuncTarget target,
        string memory signature
    ) external onlyOwner {
        _setSignature(target, signature);
    }

    function _requireNotZero(address addr) internal pure {
        if (addr == address(0)) {
            revert ZeroAddress();
        }
    }

    /**
     *
     * @notice Set the `target` for `signature`.
     */
    function _setSignature(
        FuncTarget target,
        string memory signature
    ) internal {
        bytes4 sig = bytes4(keccak256(bytes(signature)));
        _selectorToTarget[sig] = target;
        emit SignatureSet(target, sig);
    }

    /**
     *
     * @notice Define the target of given signature.
     */
    function selectorToTarget(
        bytes4 sig
    ) external view override returns (address) {
        FuncTarget target = _selectorToTarget[sig];
        if (target == FuncTarget.POD_MANAGER) {
            return address(_podManager);
        }
        if (target == FuncTarget.DELEGATION_MANAGER) {
            return address(_delegationManager);
        }

        // if nothing matched try to get pod
        return address(_podManager.getPod(_msgSender()));
    }

    function getEigenPodManager()
        external
        view
        override
        returns (IEigenPodManager)
    {
        return _podManager;
    }

    function getDelegationManager()
        external
        view
        override
        returns (IDelegationManager)
    {
        return _delegationManager;
    }
}

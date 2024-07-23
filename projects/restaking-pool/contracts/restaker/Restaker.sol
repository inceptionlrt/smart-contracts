// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "../interfaces/IEigenPodManager.sol";
import "./IRestaker.sol";
import "./IRestakerFacets.sol";

/**
 * @title Modified ERC-2535 to make calls with context of this contract.
 * @author GenesisLRT
 * @dev To make a call to any contract from facet just wrap address to needed interface.
 */
contract Restaker is OwnableUpgradeable, IRestaker {
    IRestakerFacets internal _facets;
    address internal _signer;

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
        IRestakerFacets facets
    ) public override initializer {
        __Ownable_init(owner);
        __Restaker_init(facets);
    }

    function __Restaker_init(IRestakerFacets facets) internal onlyInitializing {
        _facets = facets;

        // deploy EigenPod
        facets.getEigenPodManager().createPod();
    }

    /**
     * @notice Claim ETH to owner.
     * @dev __ at begining used to not override selectors accidentally.
     */
    function __claim() external override {
        uint256 amount = address(this).balance;
        address recipient = owner();
        if (amount > 0) {
            (bool success, ) = payable(recipient).call{value: amount}("");
            if (!success) {
                revert RestakerCannotClaim();
            }
            emit Claimed(recipient, amount);
        }
    }

    /**
     *
     * @dev Mix of OpenZeppelin proxy {_delegate()} method and ERC-2535 with {call} instead of {delegatecall}.
     */
    fallback() external payable virtual onlyOwner {
        address target = _facets.selectorToTarget(msg.sig);
        require(target != address(0));
        uint256 value = msg.value;
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the pod.
            // out and outsize are 0 because we don't know the size yet.
            let result := call(gas(), target, value, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // call returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}
}

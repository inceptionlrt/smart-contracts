// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

import "./IRestakerDeployer.sol";
import "./IRestaker.sol";
import "./IRestakerFacets.sol";

/**
 * @title create2 deployer of {Restaker}
 * @author GenesisLRT
 * @notice Not upgradeable contracts makes possible to everyone deploy new instance of Restaker.
 */
contract RestakerDeployer is IRestakerDeployer {
    bytes public constant BEACON_PROXY_BYTECODE =
        type(BeaconProxy).creationCode;

    address public immutable beacon;

    IRestakerFacets public immutable facets;

    uint256 public nonce;

    constructor(address beacon_, IRestakerFacets facets_) {
        beacon = beacon_;
        facets = facets_;
    }

    function deployRestaker() external override returns (IRestaker restaker) {
        address creator = msg.sender;
        restaker = IRestaker(
            Create2.deploy(0, bytes32(nonce), _getPreparedBytecode())
        );
        restaker.initialize(creator, facets);
        emit RestakerDeployed(creator, restaker, nonce++);
        return restaker;
    }

    /*******************************************************************************
                        VIEW FUNCTIONS
    *******************************************************************************/

    function getRestaker(uint256 id) external view override returns (address) {
        return
            Create2.computeAddress(
                bytes32(id),
                keccak256(_getPreparedBytecode())
            );
    }

    function _getPreparedBytecode() internal view returns (bytes memory) {
        return abi.encodePacked(BEACON_PROXY_BYTECODE, abi.encode(beacon, ""));
    }
}

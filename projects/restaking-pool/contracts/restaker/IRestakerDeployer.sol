// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IRestaker.sol";

interface IRestakerDeployer {
    event RestakerDeployed(
        address indexed creator,
        IRestaker indexed restaker,
        uint256 id
    );

    function BEACON_PROXY_BYTECODE() external view returns (bytes memory);

    function beacon() external view returns (address);

    function nonce() external view returns (uint256);

    function deployRestaker() external returns (IRestaker restaker);

    function getRestaker(uint256 id) external view returns (address);
}

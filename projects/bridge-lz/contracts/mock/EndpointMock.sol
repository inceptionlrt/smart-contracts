// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@layerzerolabs/test-devtools-evm-hardhat/contracts/mocks/EndpointV2Mock.sol";

contract EndpointMock is EndpointV2Mock {

    constructor(uint32 _eid) EndpointV2Mock(_eid){
    }
}
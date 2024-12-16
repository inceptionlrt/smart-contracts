// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {OptionsBuilder} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";

contract OptionsCreator {
    using OptionsBuilder for bytes;

    /// @notice Creates options for executing `lzReceive` on the destination chain.
    /// @param _gas The gas amount for the `lzReceive` execution.
    /// @param _value The msg.value for the `lzReceive` execution.
    /// @return bytes-encoded option set for `lzReceive` executor.
    function createLzReceiveOption(
        uint256 _gas,
        uint256 _value
    ) public pure returns (bytes memory) {
        return
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(
                uint128(_gas),
                uint128(_value)
            );
    }
}

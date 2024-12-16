// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface IFraxFerry {
    function embarkWithRecipient(uint amount, address recipient) external;

    function embark(uint amount) external;

    function embarkWithSignature(
        uint256 _amount,
        address recipient,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

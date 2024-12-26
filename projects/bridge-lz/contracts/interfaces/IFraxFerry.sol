// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface IFraxFerry {
    event FerryChanged(address ferry);
    error errNullFerry();

    function FEE_RATE() external view returns (uint256);

    function FEE_MIN() external view returns (uint256);

    function FEE_MAX() external view returns (uint256);

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

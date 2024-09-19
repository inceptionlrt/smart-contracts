// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

interface IInceptionBridgeStorage {
    struct Metadata {
        bytes32 name;
        bytes32 symbol;
        uint256 originChain;
        address originAddress;
    }

    event ShortCapChanged(
        address indexed token,
        uint256 prevValue,
        uint256 newValue
    );
    event LongCapChanged(
        address indexed token,
        uint256 prevValue,
        uint256 newValue
    );

    event ShortCapDurationChanged(uint256 prevValue, uint256 newValue);
    event LongCapDurationChanged(uint256 prevValue, uint256 newValue);

    event BridgeAdded(address indexed bridge, uint256 destinationChain);
    event BridgeRemoved(address indexed bridge, uint256 destinationChain);

    event DestinationAdded(
        address indexed fromToken,
        address indexed toToken,
        uint256 toChain
    );
    event DestinationRemoved(
        address indexed fromToken,
        address indexed toToken,
        uint256 toChain
    );

    event NotaryChanged(address indexed prevValue, address indexed newValue);

    event XERC20LockboxAdded(address indexed token, address indexed lockbox);
}

interface IInceptionBridge {
    event Deposited(
        uint256 destinationChain,
        address indexed destinationBridge,
        address indexed sender,
        address indexed receiver,
        address fromToken,
        address toToken,
        uint256 amount,
        uint256 nonce,
        IInceptionBridgeStorage.Metadata metadata
    );

    event Withdrawn(
        bytes32 receiptHash,
        address indexed sender,
        address indexed receiver,
        address fromToken,
        address toToken,
        uint256 amount
    );

    function deposit(
        address fromToken,
        uint256 destinationChain,
        address receiver,
        uint256 amount
    ) external;

    function withdraw(
        bytes calldata encodedProof,
        bytes calldata rawReceipt,
        bytes memory receiptRootSignature
    ) external;
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AbstractLZCrossChainAdapter} from "../abstract/AbstractLZCrossChainAdapter.sol";
import {AbstractCrossChainAdapterL2} from "../abstract/AbstractCrossChainAdapterL2.sol";
import {AbstractCrossChainAdapter} from "../abstract/AbstractCrossChainAdapter.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {AbstractFraxFerryERC20Adapter} from "../abstract/AbstractFraxFerryERC20Adapter.sol";
import {IAdapter} from "../interfaces/IAdapter.sol";
import {IFraxFerry} from "../interfaces/IFraxFerry.sol";

import {Origin} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

/**
 * @title FraxFerryLZCrossChainAdapterL2
 * @author InceptionLRT
 * @dev Layer 2 adapter for LayerZero cross-chain communication, supporting ERC20 transfers and data messaging with Layer 1.
 * This contract manages endpoint and chain ID mappings, enables quoting for cross-chain transactions, and provides functions for
 * data transfer to L1.
 */
contract FraxFerryLZCrossChainAdapterL2 is
    AbstractLZCrossChainAdapter,
    AbstractCrossChainAdapterL2,
    AbstractFraxFerryERC20Adapter,
    Initializable,
    Ownable2StepUpgradeable
{
    uint32 private _l1ChainId;

    modifier onlyOwnerRestricted()
        override(AbstractCrossChainAdapter, AbstractLZCrossChainAdapter) {
        _checkOwner();
        _;
    }

    modifier onlyTargetReceiverRestricted() override {
        require(
            msg.sender == targetReceiver || msg.sender == owner(),
            NotTargetReceiver(msg.sender)
        );
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize(
        address _token,
        address _ferry,
        address _endpoint,
        address _delegate,
        uint32 l1ChainId,
        uint32[] memory _eIds,
        uint256[] memory _chainIds
    ) public initializer {
        __Ownable2Step_init();
        __OAppUpgradeable_init(_endpoint, _delegate);
        require(_eIds.length == _chainIds.length, ArraysLengthsMismatch());
        _l1ChainId = l1ChainId;
        token = IERC20(_token);
        ferry = IFraxFerry(payable(_ferry));
        for (uint256 i = 0; i < _eIds.length; i++)
            setChainIdFromEid(_eIds[i], _chainIds[i]);
    }

    function setDestination(address _dest) external onlyOwnerRestricted {
        require(_dest != address(0), errNullDestination());
        erc20DestinationChain = _dest;
        emit DestinationChanged(_dest);
    }

    function setFerry(address _ferry) external onlyOwnerRestricted {
        require(_ferry != address(0), IFraxFerry.errNullFerry());
        ferry = IFraxFerry(payable(_ferry));
        emit IFraxFerry.FerryChanged(_ferry);
    }

    function quote(bytes calldata _payload, bytes memory _options)
        external
        view
        override
        returns (uint256)
    {
        return _quote(_l1ChainId, _payload, _options);
    }

    function sendDataL1(bytes calldata _payload, bytes memory _options)
        external
        payable
        override
        onlyTargetReceiverRestricted
        returns (uint256)
    {
        return _sendCrosschain(_l1ChainId, _payload, _options);
    }

    function _lzReceive(
        Origin calldata origin,
        bytes32, /*_guid*/
        bytes calldata,
        address, /*_executor*/
        bytes calldata /*_extraData*/
    ) internal virtual override {
        uint256 chainId = getChainIdFromEid(origin.srcEid);
        if (msg.value > 0) _handleCrossChainEth(chainId);
    }

    /// @dev This will allow TargetReceiver to recover ERC20 accidentally sent to the adapter itself.
    // Tokens will be sent back to TargetReceiver (aka vault).
    function recoverFunds()
        external
        override(AbstractCrossChainAdapter, IAdapter)
        onlyOwnerRestricted
    {
        require(targetReceiver != address(0), TargetReceiverNotSet());
        token.transfer(targetReceiver, token.balanceOf(address(this)));
    }

    // stubs for eth methods
    function sendEthCrossChain(
        uint256, /*_chainId */
        bytes memory /* _options */
    )
        external
        payable
        override(AbstractLZCrossChainAdapter, IAdapter)
        returns (uint256)
    {
        revert NotAllowedInThisAdapterType();
    }

    function quoteSendEth(
        uint256, /* _chainId */
        bytes memory /* _options */
    )
        external
        pure
        override(AbstractLZCrossChainAdapter, IAdapter)
        returns (uint256)
    {
        revert NotAllowedInThisAdapterType();
    }

    function setDelegateToCurrentOwner() external onlyOwnerRestricted {
        address delegate = owner();
        endpoint.setDelegate(delegate);
        emit LZDelegateSet(delegate);
    }
}

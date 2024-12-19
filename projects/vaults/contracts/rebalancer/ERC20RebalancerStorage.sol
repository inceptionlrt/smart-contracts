// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


import "../interfaces/IRebalancer.sol";
import {IInceptionVault} from "../interfaces/IInceptionVault.sol";
import {IInceptionToken} from "../interfaces/IInceptionToken.sol";
import {IInceptionRatioFeed} from "../interfaces/IInceptionRatioFeed.sol";
import {ICrossChainBridgeL1} from "../interfaces/ICrossChainBridgeL1.sol";

/**
 * @author The InceptionLRT team
 * @title ERC20RebalancerStorage
 * @dev TODO
 */
contract ERC20RebalancerStorage is
    Initializable,
    Ownable2StepUpgradeable,
    IRebalancer
{
    using SafeERC20 for IERC20;

    IERC20 public underlyingAsset;
    IInceptionToken public inceptionToken;
    address public lockBox;
    IInceptionVault public inceptionVault;

    address public ratioFeed;
    address public operator;

    mapping(uint256 => Transaction) public txs;

    /// @dev xxx
    mapping(uint256 => address payable) infoAdapters;
    mapping(uint256 => address payable) underlyingTokenAdapters;

    address payable public defaultAdapter;
    uint256[] public chainIds;

    uint256[50 - 9] private __gap;

    modifier onlyOperator() {
        require(msg.sender == operator, OnlyOperator());
        _;
    }

    modifier onlyAdapter(uint256 _chainId) {
        require(
            msg.sender == _getInfoAdapter(_chainId) ||
                msg.sender == _getInfoAdapter(_chainId),
            OnlyAdapter()
        );
        _;
    }

    function __RebalancerStorage_init(
        address _inceptionToken,
        address _underlyingAsset,
        address _lockbox,
        address _inceptionVault,
        address payable _defaultAdapter,
        address _ratioFeed,
        address _operator
    ) internal {
        require(_inceptionToken != address(0), SettingZeroAddress());
        require(_underlyingAsset != address(0), SettingZeroAddress());
        require(_lockbox != address(0), SettingZeroAddress());
        require(_inceptionVault != address(0), SettingZeroAddress());
        require(_defaultAdapter != address(0), SettingZeroAddress());
        require(_ratioFeed != address(0), SettingZeroAddress());
        require(_operator != address(0), SettingZeroAddress());

        inceptionToken = IInceptionToken(_inceptionToken);
        emit InceptionTokenChanged(address(0), _inceptionToken);

        underlyingAsset = IERC20(_underlyingAsset);
        emit UnderlyingAssetChanged(address(0), _underlyingAsset);

        lockBox = _lockbox;
        emit LockboxChanged(address(0), _lockbox);

        inceptionVault = IInceptionVault(_inceptionVault);
        emit LiqPoolChanged(address(0), _inceptionVault);

        defaultAdapter = _defaultAdapter;
        emit DefaultBridgeChanged(address(0), _defaultAdapter);

        ratioFeed = _ratioFeed;
        emit RatioFeedChanged(address(0), ratioFeed);

        operator = _operator;
        emit OperatorChanged(address(0), _operator);
    }

    /**
     * @notice Retrieves the transaction for a specific Chain ID. NB! Only one (last) transaction is stored.
     * @param _chainId The Chain ID for which to retrieve the last transaction data.
     * @return The transaction data (timestamp, ETH balance, inETH balance).
     */
    function getTransactionData(uint256 _chainId)
        public
        view
        returns (Transaction memory)
    {
        return txs[_chainId];
    }

    /****************************************************
     ********************* Adapters *********************
     ****************************************************/

    /**
     * @dev Replaces the crosschain bridges
     * @param _newAdapter The address of the defaultAdapter.
     */
    function addInfoAdapter(uint256 _chainId, address payable _newAdapter)
        external
        onlyOwner
    {
        require(_newAdapter != address(0), SettingZeroAddress());
        infoAdapters[_chainId] = _newAdapter;
        _addChainId(_chainId);

        emit AdapterAdded(_chainId, _newAdapter);
    }

    function addUnderlyingTokenAdapters(
        uint256 _chainId,
        address payable _newAdapter
    ) external onlyOwner {
        require(_newAdapter != address(0), SettingZeroAddress());
        underlyingTokenAdapters[_chainId] = _newAdapter;
        _addChainId(_chainId);

        emit AdapterAdded(_chainId, _newAdapter);
    }

    /**
     * @notice Fetches the adapter assigned to a specific chain ID
     * @param _chainId The Chain ID
     * @return adapter address of the adapter for the specified chainId. Returns 0 if non set
     * @return isDefault whether the returned adapter is default or not (from the mapping)
     */
    function getInfoAdapter(uint256 _chainId)
        external
        view
        returns (address payable adapter, bool isDefault)
    {
        adapter = _getInfoAdapter(_chainId);
        if (adapter == defaultAdapter) isDefault = true;
    }

    function _getInfoAdapter(uint256 _chainId)
        internal
        view
        returns (address payable adapter)
    {
        adapter = infoAdapters[_chainId];
        if (adapter == address(0)) adapter = defaultAdapter;

        require(adapter != address(0), NoAdapterAvailable(_chainId));
    }

    /****************************************************
     ********************* ChainIds *********************
     ****************************************************/

    function addChainId(uint256 _newChainId) external onlyOwner {
        _addChainId(_newChainId);
    }

    /**
     * @notice Adds a new Chain ID to the storage.
     * @dev Ensures that the Chain ID does not already exist in the list.
     * @param _newChainId The Chain ID to add.
     */
    function _addChainId(uint256 _newChainId) internal {
        for (uint i = 0; i < chainIds.length; i++) {
            if (chainIds[i] == _newChainId) return;
        }
        chainIds.push(_newChainId);
        emit ChainIdAdded(_newChainId);
    }

    /**
     * @notice Removes a specific `chainId` from the `chainIds` array.
     * @param _chainId The Chain ID to delete.
     */
    function deleteChainId(uint256 _chainId) public onlyOwner {
        uint256 index;
        bool found = false;

        // Find the _chainId in the array
        for (uint256 i = 0; i < chainIds.length; i++) {
            if (chainIds[i] == _chainId) {
                index = i;
                found = true;
                break;
            }
        }

        require(found, ChainIdNotFound(_chainId));

        // Move the last element into the place of the one to delete
        chainIds[index] = chainIds[chainIds.length - 1];
        chainIds.pop();

        emit ChainIdDeleted(_chainId, index);
    }

    /****************************************************
     ********************* Settings *********************
     ****************************************************/

    /**
     * @notice set the so-called defaultAdapter - the adapter to be used for every chain unless a
      specific adapter for specific chainId is set
     * @param _newDefaultAdapter Address of the default cross-chain adapter
     **/
    function setDefaultAdapter(address payable _newDefaultAdapter)
        external
        onlyOwner
    {
        require(_newDefaultAdapter != address(0), SettingZeroAddress());

        emit DefaultBridgeChanged(defaultAdapter, _newDefaultAdapter);
        defaultAdapter = _newDefaultAdapter;
    }

    /**
     * @notice Updates the InceptionToken address.
     * @param _inceptionToken The new InceptionToken address.
     */
    function setInceptionToken(IInceptionToken _inceptionToken)
        external
        onlyOwner
    {
        require(address(_inceptionToken) != address(0), SettingZeroAddress());
        // emit InceptionTokenChanged(inceptionToken, _inceptionToken);
        inceptionToken = _inceptionToken;
    }

    /**
     * @notice Updates the underlying asset address.
     * @param _underlyingAsset The new InceptionToken address.
     */
    function setUnderlyingAsset(IERC20 _underlyingAsset)
        external
        onlyOwner
    {
        require(address(_underlyingAsset) != address(0), SettingZeroAddress());
        // emit InceptionTokenChanged(inceptionToken, _inceptionToken);
        underlyingAsset = _underlyingAsset;
    }

    /**
     * @notice Updates the Lockbox address.
     * @param _lockbox The new Lockbox address.
     */
    function setLockbox(address _lockbox) external onlyOwner {
        require(_lockbox != address(0), SettingZeroAddress());
        emit LockboxChanged(lockBox, _lockbox);
        lockBox = _lockbox;
    }

    /**
     * @notice Updates the liquidity pool address.
     * @param _inceptionVault The new Inception Vault address.
     */
    function setInceptionVault(IInceptionVault _inceptionVault)
        external
        onlyOwner
    {
        require(address(_inceptionVault) != address(0), SettingZeroAddress());
        // TODO
        // emit LiqPoolChanged(liqPool, _liqPool);
        inceptionVault = _inceptionVault;
    }

    /**
     * @notice Updates the operator address.
     * @param _operator The new operator address.
     */
    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), SettingZeroAddress());
        emit OperatorChanged(operator, _operator);
        operator = _operator;
    }
}

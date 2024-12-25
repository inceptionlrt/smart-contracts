// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IRebalancer} from "../interfaces/IRebalancer.sol";
import {IInceptionVault} from "../interfaces/IInceptionVault.sol";
import {IInceptionToken} from "../interfaces/IInceptionToken.sol";

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
    IERC20 public underlyingAsset;
    IInceptionToken public inceptionToken;
    address public lockBox;
    IInceptionVault public inceptionVault;

    address public operator;

    Transaction public lastTx;

    address payable public defaultAdapter;
    uint256 public defaultChainId;
    uint256 public assetInfoTxMaxDelay;

    uint256[50 - 9] private __gap;

    modifier onlyOperator() {
        require(msg.sender == operator, OnlyOperator());
        _;
    }

    modifier onlyAdapter() {
        require(msg.sender == defaultAdapter, OnlyAdapter());
        _;
    }

    function __RebalancerStorage_init(
        uint256 _defaultChainId,
        address _inceptionToken,
        address _underlyingAsset,
        address _lockbox,
        address _inceptionVault,
        address payable _defaultAdapter,
        address _operator
    ) internal {
        require(_defaultChainId != 0, SettingZeroAddress());
        require(_inceptionToken != address(0), SettingZeroAddress());
        require(_underlyingAsset != address(0), SettingZeroAddress());
        require(_lockbox != address(0), SettingZeroAddress());
        require(_inceptionVault != address(0), SettingZeroAddress());
        require(_defaultAdapter != address(0), SettingZeroAddress());
        require(_operator != address(0), SettingZeroAddress());

        defaultChainId = _defaultChainId;
        emit DefaultChainIdChanged(0, _defaultChainId);

        inceptionToken = IInceptionToken(_inceptionToken);
        emit InceptionTokenChanged(address(0), _inceptionToken);

        underlyingAsset = IERC20(_underlyingAsset);
        emit UnderlyingAssetChanged(address(0), _underlyingAsset);

        lockBox = _lockbox;
        emit LockboxChanged(address(0), _lockbox);

        inceptionVault = IInceptionVault(_inceptionVault);
        emit LiqPoolChanged(address(0), _inceptionVault);

        defaultAdapter = _defaultAdapter;
        emit DefaultAdapterChanged(address(0), _defaultAdapter);

        operator = _operator;
        emit OperatorChanged(address(0), _operator);
    }


    function _lockboxSupply() internal view returns (uint256) {
        return IERC20(address(inceptionToken)).balanceOf(lockBox);
    }

    function getTransactionData()
        public
        view
        returns (Transaction memory)
    {
        return lastTx;
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
        emit DefaultAdapterChanged(defaultAdapter, _newDefaultAdapter);
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
        emit InceptionTokenChanged(address(inceptionToken),address(_inceptionToken));
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
        emit UnderlyingAssetChanged(address(underlyingAsset), address(_underlyingAsset));
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
        emit LiqPoolChanged(address(inceptionVault), address(_inceptionVault));
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

    /**
     * @notice Updates the default chainId.
     * @param _defaultChainId The new default chain Id.
     */
    function setDefaultChainId(uint256 _defaultChainId) external onlyOwner {
        /// TODO: incorrect the error naming
        require(_defaultChainId != 0, SettingZeroAddress());
        emit DefaultChainIdChanged(defaultChainId, _defaultChainId);
        defaultChainId = _defaultChainId;
    }

    /**
     * @notice Updates the expiry time of L2 info.
     * @param _delay The new TTL for L2 info packet.
     */
    function setInfoMaxDelay(uint256 _delay) external onlyOwner {
        /// TODO: require ?
        assetInfoTxMaxDelay = _delay;
        emit AssetInfoTxMaxDelayChanged(_delay);
    }
}

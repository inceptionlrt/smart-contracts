// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ReentrancyGuardUpgradeable  } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { PausableUpgradeable         } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { Ownable2StepUpgradeable     } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { IAdaptorController          } from "./interfaces/IAdaptorController.sol";

import { Math                        } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IAdaptorBase                } from "./adaptors/interfaces/IAdaptorBase.sol";
import { IERC4626, SafeERC20, IERC20 } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";

// --- AdaptorController ---
contract AdaptorController is ReentrancyGuardUpgradeable, PausableUpgradeable, Ownable2StepUpgradeable, IAdaptorController {

    // --- Wrappers ---
    using Math for uint256;
    using SafeERC20 for IERC20;

    // --- Vars ---
    address public vault;
    address public priceController;
    address public yieldHeritor;
    address public operator;
    uint256 public totalAllocations;

    mapping(address _vault => uint256 _allocation) public allocations;
    address[] public adaptors;

    // --- Mods ---
    modifier onlyVault {

        if (_msgSender() != vault) revert AdaptorController_OnlyVault();
        _;
    }
    modifier onlyOperatorOrOwner {

        if (_msgSender() != operator || _msgSender() != owner()) revert AdaptorController_NotOperatorOrOwner();
        _;
    }

    // --- Constructor ---
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    // --- Init ---
    function __AdaptorController_init(address _vault, address _priceController, address _yieldHeritor) internal onlyInitializing {

        vault = _vault;
        priceController = _priceController;
        yieldHeritor = _yieldHeritor;
    }
    function initialize(address _vault, address _priceController, address _yieldHeritor) external virtual initializer {

        __AdaptorController_init(_vault, _priceController, _yieldHeritor);
    }

    // --- NonViews ---
    function requestDelegate(address _adaptor, uint256 _assets) external onlyVault nonReentrant whenNotPaused {

        if (adaptors.length <= 0) revert AdaptorController_NoAdaptors();

        address[] memory _adaptorsArray;
        uint256[] memory _assetsArray;

        (_adaptorsArray, _assetsArray) = _adaptor == address(0) ? (adaptors, _split(_assets)) : (_makeArray(_adaptor), _makeArray(_assets));
        IERC20(asset()).safeTransferFrom(vault, address(this), _assets);

        _requestDelegate(_adaptorsArray, _assetsArray);
    }
    function _requestDelegate(address[] memory _adaptors, uint256[] memory _assets) internal {

        for (uint8 i = 0; i < _adaptors.length; ) {
    
            IERC20(asset()).approve(_adaptors[i], _assets[i]);
            IAdaptorBase(_adaptors[i]).provide(_assets[i]);

            emit RequestDelegate(_adaptors[i], _assets[i]);

            unchecked { i++; }
        }
    }
    function requestUndelegate(address _adaptor, uint256 _assets) external onlyVault nonReentrant whenNotPaused {

        if (adaptors.length <= 0) revert AdaptorController_NoAdaptors();

        address[] memory _adaptorsArray;
        uint256[] memory _assetsArray;

        if (_adaptor == address(0) && _assets == 0) (_adaptorsArray, _assetsArray) = (adaptors, totalAssetsPerAdaptor());
        else if (_adaptor == address(0) && _assets != 0) (_adaptorsArray, _assetsArray) = (adaptors, _split(_assets));
        else if (_adaptor != address(0) && _assets == 0) (_adaptorsArray, _assetsArray) = (_makeArray(_adaptor), _makeArray(totalAssets(_adaptor)));
        else (_makeArray(_adaptor), _makeArray(_assets));

        _requestUndelegate(_adaptorsArray, _assetsArray);
    }
    function _requestUndelegate(address[] memory _adaptors, uint256[] memory _assets) internal {

        for (uint8 i = 0; i < _adaptors.length; ) {

            IAdaptorBase(_adaptors[i]).release(_assets[i], vault);

            emit RequestUndelegate(_adaptors[i], _assets[i]);

            unchecked { i++; }
        }
    }
    function requestClaim(address _adaptor) external onlyVault {

        if (adaptors.length <= 0) revert AdaptorController_NoAdaptors();

        address[] memory _adaptorsArray;

        if (_adaptor == address(0)) _adaptorsArray = adaptors;
        else _adaptorsArray = _makeArray(_adaptor);

        _requestClaim(_adaptorsArray);
    }
    function _requestClaim(address[] memory _adaptors) internal {

        for (uint8 i = 0; i < adaptors.length; ) {

            IAdaptorBase(adaptors[i]).claim();

            emit RequestClaim();

            unchecked { i++; }
        }
    }
    function requestRebalance() external onlyVault {
        // rebalance
    }
    function addAdaptor(address _adaptor) external onlyOwner {

        if (_adaptor == address(0)) revert AdaptorController_InvalidAddress();

        for (uint8 i = 0; i < adaptors.length; ) {

            if (adaptors[i] == _adaptor) revert AdaptorController_Duplicate();

            unchecked { i++; }
        }

        adaptors.push(_adaptor);

        emit AdaptorAdded(_adaptor);
    }
    function setAllocation(address _adaptor, uint256 _newAllocation) external onlyOperatorOrOwner whenNotPaused {

        if (_adaptor == address(0)) revert AdaptorController_InvalidAddress();

        uint256 oldAllocation = allocations[_adaptor];
        allocations[_adaptor] = _newAllocation;

        totalAllocations = totalAllocations + _newAllocation - oldAllocation;

        emit AllocationsSet(_adaptor, oldAllocation, _newAllocation);
    }
    function setYieldHeritor(address _yieldHeritor) external onlyOwner {

        if (_yieldHeritor == address(0)) revert AdaptorController_InvalidAddress();

        address oldHeritor = yieldHeritor;
        yieldHeritor = _yieldHeritor;

        emit YieldHeritorSet(oldHeritor, _yieldHeritor);
    }
    function setOperator(address _operator) external onlyOwner {

        if (_operator == address(0)) revert AdaptorController_InvalidAddress();

        address oldOperator = operator;
        operator = _operator;

        emit OperatorSet(oldOperator, _operator);
    }

    // --- Views ---
    function asset() public view returns (address) {

        return IERC4626(vault).asset();
    }
    function totalAssets() public view returns (uint256 _sum) {

        for (uint8 i = 0; i < adaptors.length; ) {

            _sum += totalAssets(address(adaptors[i]));

            unchecked { i++; }
        }
    }
    function totalAssets(address _adaptor) public view returns (uint256 _sum) {

        _sum = IAdaptorBase(_adaptor).totalAssets();
    }
    function totalAssetsPerAdaptor() public view returns (uint256[] memory _assets) {

        uint256 length = adaptors.length;
        _assets = new uint256[](length);

        for (uint8 i = 0; i < length; ) {

            _assets[i] = totalAssets(adaptors[i]);

            unchecked { i++; }
        }
    }
    function isAdaptor(address _adaptor) external returns (bool) {

        for (uint8 i = 0; i < adaptors.length; ) {

            if (adaptors[i] == _adaptor) return true;

            unchecked { i++; }
        }
    }

    // --- Pausable ---
    function pause() external onlyOwner whenNotPaused {

        _pause();
    }
    function unpause() external onlyOwner whenPaused {

        _unpause();
    }
    
    // --- Helpers ---
    function _split(uint256 _amount) internal view returns (uint256[] memory _subAmounts) {

        uint256 length = adaptors.length;
        _subAmounts = new uint256[](length);

        uint256 allocationsTotal = totalAllocations;
        for (uint256 i = 0; i < length; ) {
            _subAmounts[i] = _amount.mulDiv(allocations[adaptors[i]], allocationsTotal, Math.Rounding.Floor);
            
            unchecked { i++; }
        }
    }
    function _makeArray(address _value) internal view returns (address[] memory _array) {
        _array = new address[](1);
        _array[0] = _value;
    }
    function _makeArray(uint256 _value) internal view returns (uint256[] memory _array) {
        _array = new uint256[](1);
        _array[0] = _value;
    }
}
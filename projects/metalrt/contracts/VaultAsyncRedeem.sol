// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { PausableUpgradeable        } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { Ownable2StepUpgradeable    } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { ERC4626Upgradeable         } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { IERC165                    } from "@openzeppelin/contracts/interfaces/IERC165.sol";
import { IERC7540Redeem             } from "./interfaces/IERC7540.sol";

import { Math                       } from "@openzeppelin/contracts/utils/math/Math.sol";
import { SafeERC20, IERC20          } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { IERC7540Operator           } from "./interfaces/IERC7540.sol";

// --- VaultAsyncRedeem ---
contract VaultAsyncRedeem is ReentrancyGuardUpgradeable, PausableUpgradeable, Ownable2StepUpgradeable, ERC4626Upgradeable, IERC165, IERC7540Redeem {

    // --- Wrappers ---
    using Math for uint256;
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 internal constant REQUEST_ID = 0;

    // --- Vars ---
    mapping(address => PendingRedeem) internal _pendingRedeem;
    mapping(address => ClaimableRedeem) internal _claimableRedeem;
    mapping(address => mapping(address => bool)) public isOperator;

    // --- Structures ---
    struct PendingRedeem {
        uint256 shares;
    }
    struct ClaimableRedeem {
        uint256 assets;
        uint256 shares;
    }

    // --- Erros ---
    error ERC7540_OperatorIsSelf();
    error ERC7540_InvalidOwner();
    error ERC7540_InsufficientBalance();
    error ERC7540_ZeroShares();
    error ERC7540_InvalidCaller();
    error ERC7540_InvalidAmount();
    error ERC7540_AsyncFlow();

    // --- Constructor ---
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    // --- Init ---
    function __VaultAsyncRedeem_init(string memory _name, string memory _symbol, address _asset) internal onlyInitializing {
        
        __ReentrancyGuard_init();
        __Pausable_init();
        __Ownable_init(_msgSender());
        __ERC20_init(_name, _symbol);
        __ERC4626_init(IERC20(_asset));
    }
    function initialize(string memory _name, string memory _symbol, address _asset) external virtual initializer {

        __VaultAsyncRedeem_init(_name, _symbol, _asset);
    }

    // --- ERC7540 ---
    function setOperator(address _operator, bool _approved) public virtual returns (bool) {
        
        address src = _msgSender();

        if (src == _operator) revert ERC7540_OperatorIsSelf();

        isOperator[src][_operator] = _approved;
        emit OperatorSet(src, _operator, _approved);

        return true;
    }
    function requestRedeem(uint256 _shares, address _controller, address _owner) external virtual override whenNotPaused nonReentrant returns (uint256 _requestId) {

        address src = _msgSender();
        if (src != _owner && !isOperator[_owner][src]) revert ERC7540_InvalidOwner();
        else if (this.balanceOf(_owner) < _shares) revert ERC7540_InsufficientBalance();
        else if (_shares == 0) revert ERC7540_ZeroShares();

        SafeERC20.safeTransferFrom(this, _owner, address(this), _shares);

        uint256 currentPendingShares = _pendingRedeem[_controller].shares;
        _pendingRedeem[_controller] = PendingRedeem(_shares + currentPendingShares);
        emit RedeemRequest(_controller, _owner, REQUEST_ID, src, _shares);

        return REQUEST_ID;
    }
    function pendingRedeemRequest(uint256, address _controller) public view returns (uint256 _pendingShares) {

        _pendingShares = _pendingRedeem[_controller].shares;
    }
    function claimableRedeemRequest(uint256, address _controller) public view returns (uint256 _claimableShares) {

        _claimableShares = _claimableRedeem[_controller].shares;
    }
    function fulfillRedeem(address _controller, uint256 _shares) public onlyOwner returns (uint256 _assets) {

        PendingRedeem storage request = _pendingRedeem[_controller];
        if (request.shares == 0 || _shares <= request.shares) revert ERC7540_ZeroShares();

        _assets = convertToAssets(_shares);
        _burn(address(this), _shares);

        _claimableRedeem[_controller] = ClaimableRedeem(_claimableRedeem[_controller].assets + _assets, _claimableRedeem[_controller].shares + _shares);

        request.shares -= _shares;
    }
    function withdraw(uint256 _assets, address _receiver, address _controller) public virtual override whenNotPaused nonReentrant returns (uint256 _shares) {

        address src = _msgSender();
        if (_controller != src && !isOperator[_controller][src]) revert ERC7540_InvalidCaller();
        else if (_assets == 0) revert ERC7540_InvalidAmount();

        ClaimableRedeem storage claimable = _claimableRedeem[_controller];
        _shares = _assets.mulDiv(claimable.shares, claimable.assets, Math.Rounding.Floor);
        uint256 sharesUp = _assets.mulDiv(claimable.shares, claimable.assets, Math.Rounding.Ceil);

        claimable.assets -= _assets;
        claimable.shares = claimable.shares > sharesUp ? claimable.shares - sharesUp : 0;

        IERC20(asset()).safeTransfer(_receiver, _assets);

        emit Withdraw(src, _receiver, _controller, _assets, _shares);
    }
    function redeem(uint256 _shares, address _receiver, address _controller) public virtual override whenNotPaused nonReentrant returns (uint256 _assets) {

        address src = _msgSender();
        if (_controller != src && !isOperator[_controller][src]) revert ERC7540_InvalidCaller();
        else if (_shares == 0) revert ERC7540_InvalidAmount();

        ClaimableRedeem storage claimable = _claimableRedeem[_controller];
        _assets = _shares.mulDiv(claimable.assets, claimable.shares, Math.Rounding.Floor);
        uint256 assetsUp = _shares.mulDiv(claimable.assets, claimable.shares, Math.Rounding.Ceil);

        claimable.assets = claimable.assets > assetsUp ? claimable.assets - assetsUp : 0;
        claimable.shares -= _shares;

        IERC20(asset()).safeTransfer(_receiver, _assets);

        emit Withdraw(msg.sender, _receiver, _controller, _assets, _shares);
    }
    function maxWithdraw(address _controller) public view virtual override returns (uint256) {

        return _claimableRedeem[_controller].assets;
    }
    function maxRedeem(address _controller) public view virtual override returns (uint256) {

        return _claimableRedeem[_controller].shares;
    }
    function previewWithdraw(uint256) public pure virtual override returns (uint256) {

        revert ERC7540_AsyncFlow();
    }
    function previewRedeem(uint256) public pure virtual override returns (uint256) {

        revert ERC7540_AsyncFlow();
    }

    // --- Pausable ---
    function pause() external onlyOwner whenNotPaused {

        _pause();
    }
    function unpause() external onlyOwner whenPaused {

        _unpause();
    }

    // --- ERC165 ---
    function supportsInterface(bytes4 _interfaceId) public pure virtual returns (bool) {

        return _interfaceId == type(IERC7540Redeem).interfaceId || _interfaceId == type(IERC7540Operator).interfaceId || _interfaceId == type(IERC165).interfaceId;
    }
}
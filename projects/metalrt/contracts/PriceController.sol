// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { IPriceController        } from "./interfaces/IPriceController.sol";

// --- PriceController ---
contract PriceController is Ownable2StepUpgradeable, IPriceController {

    // --- Vars ---
    mapping(address => TokenData) public data;

    // --- Structures ---
    enum Approach {
        REDIRECT,
        INCREASING_RATIO,
        DECREASING_RATIO
    }

    struct TokenData {
        string ratio;
        string toShares;
        string toAssets;
        Approach approach;
        address provider;
    }

    // --- Constructor ---
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    // --- Init ---
    function initialize() external initializer {

        __Ownable_init(_msgSender());
    }

    function convertToShares(address _token, uint256 _amount) external view returns (uint256) {

        TokenData memory tokenData = data[_token];
        address provider = tokenData.provider == address(0) ? _token : tokenData.provider;

        if (tokenData.approach == Approach.REDIRECT) {
            return _callWithAm(provider, tokenData.toShares, _amount);
        }

        uint256 ratio = _call(provider, tokenData.ratio);
        if (tokenData.approach == Approach.INCREASING_RATIO) {
            return _amount * 1e18 / ratio;
        }
        if (tokenData.approach == Approach.DECREASING_RATIO) {
            return _amount * ratio / 1e18;
        }

        return 0;
    }

    function convertToAssets(address _token, uint256 _amount) external view returns (uint256) {
        TokenData memory tokenData = data[_token];
        address provider = tokenData.provider == address(0) ? _token : tokenData.provider;

        if (tokenData.approach == Approach.REDIRECT) {
            return _callWithAm(provider, tokenData.toAssets, _amount);
        }

        uint256 ratio = _call(provider, tokenData.ratio);
        if (tokenData.approach == Approach.INCREASING_RATIO) {
            return _amount * ratio / 1e18;
        }
        if (tokenData.approach == Approach.DECREASING_RATIO) {
            return _amount * 1e18 / ratio;
        }

        return 0;
    }

    function _callWithAm(address _provider, string memory _method, uint256 _amount) internal view returns (uint256) {
        (bool success, bytes memory data) = _provider.staticcall(
            abi.encodeWithSignature(_method, _amount)
        );

        if (!success) {
            return 0;
        }

        (uint256 res) = abi.decode(data, (uint256));

        return res;
    }

    function _call(address _provider, string memory _method) internal view returns (uint256) {
        (bool success, bytes memory data) = _provider.staticcall(
            abi.encodeWithSignature(_method)
        );

        if (!success) {
            return 0;
        }

        (uint256 res) = abi.decode(data, (uint256));

        return res;
    }

    function setToken(address _token, string calldata _to, string calldata _from, string calldata _getRatio, bool _isIncreasing) external onlyOwner {

        if (_token == address(0)) revert PriceController_InvalidAddress();

        TokenData memory tokenData;

        if (bytes(_from).length > 0 && bytes(_to).length > 0) {
            tokenData = TokenData("", _from, _to, Approach.REDIRECT, address(0));
        } else if (bytes(_getRatio).length > 0) {
            Approach appr;
            if (_isIncreasing) {
                appr = Approach.INCREASING_RATIO;
            } else {
                appr = Approach.DECREASING_RATIO;
            }
            tokenData = TokenData(_getRatio, "", "", appr, address(0));
        } else {
            revert PriceController_UnknownApproach();
        }

        data[_token] = tokenData;
    }

    function setProviderForToken(address _token, address _provider) external onlyOwner {
        
        if (_token == address(0) || _provider == address(0)) revert PriceController_InvalidAddress();
        
        data[_token].provider = _provider;

        emit RatioProviderSet(_token, _provider); 
    }
}
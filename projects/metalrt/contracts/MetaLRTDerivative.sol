// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MetaLRTStrategic        } from "./MetaLRTStrategic.sol";
import { IMetaLRTDerivative       } from "./interfaces/IMetaLRTDerivative.sol";

import { SafeERC20               } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20                  } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Math                    } from "@openzeppelin/contracts/utils/math/Math.sol";

// --- MetaLRT Derivative ---
contract MetaLRTDerivative is MetaLRTStrategic, IMetaLRTDerivative {

    // --- Wrappers ---
    using SafeERC20 for IERC20;
    using Math for uint256;

    // --- Vars ---
    uint256 public tolerance;

    uint256[50] private __reserver;

    // --- Constructor ---
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    // --- Init ---
    function __MetaLRTDerivative_init() internal onlyInitializing {

        tolerance = 1e16;  // 1%
    }

    function initialize(string memory _name, string memory _symbol, uint256 _yieldMargin, address _underlying) external virtual override initializer {
        
        __MetaLRTCore_init(_name, _symbol, _yieldMargin, _underlying);
        __MetaLRTStrategic_init();
        __MetaLRTDerivative_init();
    }

    // --- Derivative ---
    function dDeposit(uint256[] memory _derivativeAmounts) public virtual nonReentrant whenNotPaused returns (uint256) {

        if (!verifyProportion(_derivativeAmounts)) revert("V");

        address src = _msgSender();
        // uint256 balanceBefore = totalAssets();
        address[] memory _derivatives = getDerivativeTokens();
        uint256 total;


        _claimYield();

        for (uint256 i = 0; i < _derivativeAmounts.length; i++) {
            total += ratioAdapter.toValue(_derivatives[i], _derivativeAmounts[i]);
        }

        uint256 shares = previewDeposit(total);

        for (uint256 i = 0; i < _derivatives.length; i++) {

            address derivative = _derivatives[i];
            uint256 amount = _derivativeAmounts[i];

            if (_derivativeAmounts[i] == 0) continue;
            IERC20(derivative).safeTransferFrom(src, address(this), amount);

            // unchecked { i++; }
        }

        // uint256 depositedEth = totalAssets() - balanceBefore;

        // require(depositedEth >= minAmount);

        _mint(src, shares);

        yieldBalance = getBalance();

        return shares;
    }
    function dWithdraw(uint256 shares) public virtual nonReentrant whenNotPaused returns (uint256) {

        if (shares == 0) revert();

        address claimer = msg.sender;
        uint256 ethAmount = _convertToAssets(shares, Math.Rounding.Floor);

        // require(ethAmount >= minAmount);

        if (ethAmount > totalAssets()) revert();
        
        _burn(claimer, shares);
        (address[] memory assets, uint256[] memory amounts) = split(ethAmount); //getWithdrawalAmounts(ethAmount);

        // TODO Transfer to User, we simply transfer cuz withdrawal doesn't affect allocation
    }

    function setTolerance(uint256 _newTolerance) external onlyOwner {

        tolerance = _newTolerance;
    }

    // --- Views ---
    function getDerivativeTokens() public view virtual returns (address[] memory _derivatives) {

        uint256 length = strategies.length;
        _derivatives = new address[](length);

        for (uint8 i = 0; i < length; ) {

            _derivatives[i] = stats[strategies[i]].derivative;
            unchecked { i++; }
        } 
    }
    function getTotalDerivatives() public view virtual returns (address[] memory _derivatives, uint256[] memory _shares) {

        _derivatives = getDerivativeTokens();
        _shares = new uint256[](_derivatives.length);

        for (uint8 i = 0; i < _derivatives.length; ) {

            _shares[i] = IERC20(_derivatives[i]).balanceOf(address(this));
            unchecked { i++; }
        }
    }
    function getTotalDerivativesETH() public view virtual returns (uint256 _ethValue) {

        (address[] memory _derivatives, uint256[] memory _shares) = getTotalDerivatives();

        for (uint8 i = 0; i < _derivatives.length;) {

            _ethValue += ratioAdapter.toValue(_derivatives[i], _shares[i]);
            unchecked { i++; }
        }
    }
    function isSupportedDerivative(address _derivative) internal returns (bool) {
        
        for (uint8 i = 0; i < strategies.length; ) {

            if (stats[strategies[i]].derivative == _derivative) return true;
            unchecked { i++; }
        }

        return false;
    }
    function verifyProportion(uint256[] memory _derivativeAmounts) public view returns (bool) {

        address[] memory _derivatives = getDerivativeTokens();
        
        uint256 length = _derivatives.length;
        if (length <= 0) return false;
        if (length != _derivativeAmounts.length) return false;

        uint256 sDepositTotal = getSDepositETHTotal();
        uint8 i;

        for (i = 0; i < _derivatives.length; ) {

            sDepositTotal += ratioAdapter.toValue(_derivatives[i], _derivativeAmounts[i]);
            unchecked { i++; }
        }

        (, uint256[] memory allocations) = getCurrentAllocations();

        for (i = 0; i < _derivatives.length; ) {

            address _strategy = strategies[i];
            address _derivative = stats[_strategy].derivative;
            uint256 _allocation = stats[strategies[i]].allocation;

            uint256 currentAssetAmountInETH = getSDepositETH(_strategy);
            uint256 currentProportionDiff = _allocation > allocations[i] ? _allocation - allocations[i] : allocations[i] - _allocation;
            uint256 assetNewTotalAmount = currentAssetAmountInETH + ratioAdapter.toValue(_derivative, _derivativeAmounts[i]);
            uint256 assetNewProportion = MAX_ALLOCATION.mulDiv(assetNewTotalAmount, sDepositTotal, Math.Rounding.Floor);
            uint256 newProportionDiff = _allocation > assetNewProportion ? _allocation - assetNewProportion : assetNewProportion - _allocation;

            if (newProportionDiff > currentProportionDiff) {

                if (((_allocation - tolerance >= assetNewProportion) || (assetNewProportion >= _allocation + tolerance))) return false;
            }
            unchecked { i++; }
        }

        return true;
    }
    function getCurrentAllocations() public view returns (address[] memory _derivatives, uint256[] memory _proportions) {

        _derivatives = getDerivativeTokens();
        _proportions = new uint256[](_derivatives.length);

        uint256 sTotalDeposit = getSDepositETHTotal();

        if (sTotalDeposit <= 0) return (_derivatives, _proportions);

        for (uint256 i = 0; i < _derivatives.length; ) {

            _proportions[i] = MAX_ALLOCATION.mulDiv(getSDepositByDerivativeETH(_derivatives[i]), sTotalDeposit, Math.Rounding.Floor);
            unchecked { i++; }
        }
    }
}
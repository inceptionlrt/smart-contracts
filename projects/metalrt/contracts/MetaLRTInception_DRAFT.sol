// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MetaLRTStrategic_DRAFT  } from "./MetaLRTStrategic_DRAFT.sol";
import { SafeERC20               } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20                  } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Math                    } from "@openzeppelin/contracts/utils/math/Math.sol";
import { Convert                 } from "./Convert.sol";

interface IRatioAdapter {
    function toValue(address token, uint256 amount) external view returns (uint256);
    function fromValue(address token, uint256 amount) external view returns (uint256);
}

// ERC4626 for this contract must be overriden to support ETH denomination
error ProportionWrong();
error InsufficientCapacity();
error NullParams();

contract MetaLRTInception_DRAFT is MetaLRTStrategic_DRAFT {

    using SafeERC20 for IERC20;
    using Math for uint256;

    address public instETH_E;
    address public instETH_S;
    address public rAdapter;

    uint256[47] private __reserver;

    function __MetaLRTInception_init(address _instETH_E, address _instETH_S, address _rAdapter) internal onlyInitializing {
        instETH_E = _instETH_E;
        instETH_S = _instETH_S;
        rAdapter = _rAdapter;
    }

    function iDeposit(uint256[] memory amounts) public virtual returns (uint256) {

        if (!verifyProportion(amounts)) revert ProportionWrong();

        address staker = msg.sender;
        uint256 depositedBefore = totalAssets();

        address[] memory numberOfAssets = iTokens();

        for (uint256 i = 0; i < numberOfAssets.length; ) {
            address assetAddress = numberOfAssets[i];
            uint256 amount = amounts[i];

            IERC20(assetAddress).safeTransferFrom(staker, address(this), amount);

            unchecked { i++; }
        }

        uint256 depositedEth = totalAssets() - depositedBefore;

        // require(depositedEth >= minAmount);

        uint256 iShares = _convertToShares(depositedEth, Math.Rounding.Floor);
        _mint(staker, iShares);
    }

    function iWithdraw(uint256 iShares) public virtual returns (uint256) {

        if (iShares == 0) revert NullParams();

        address claimer = msg.sender;
        uint256 ethAmount = _convertToAssets(iShares, Math.Rounding.Floor);

        // require(ethAmount >= minAmount);

        if (ethAmount > totalAssets()) revert InsufficientCapacity();
        
        _burn(claimer, iShares);
        (address[] memory assets, uint256[] memory amounts) = getWithdrawalAmounts(ethAmount);

        // Transfer to User
    }

    function iTokens() public view virtual returns (address[] memory _iTokens) {
        _iTokens = new address[](2);
        _iTokens[0] = instETH_E;
        _iTokens[1] = instETH_S;
    }

    function iConvertToAssets(address _iToken, uint256 _shares) public view virtual returns (uint256 _assets) {
        _assets = IRatioAdapter(rAdapter).toValue(_iToken, _shares);
    }

    function iConvertToShares(address _iToken, uint256 _assets) public view virtual returns (uint256 _shares) {
        _shares = IRatioAdapter(rAdapter).fromValue(_iToken, _assets);
    }

    function iTotalShares() public view virtual returns (address[] memory _iTokens, uint256[] memory _shares) {
        _iTokens = iTokens();
        _shares = new uint256[](_iTokens.length);

        for (uint8 i = 0; i < _iTokens.length;) {
            _shares[i] = IERC20(_iTokens[i]).balanceOf(address(this));

            unchecked { i++; }
        }
    }

    function iTotalAssets() public view virtual returns (uint256 _assets) {
        (address[] memory _iTokens, uint256[] memory _shares) = iTotalShares();

        for (uint8 i = 0; i < _iTokens.length;) {
            _assets += iConvertToAssets(_iTokens[i], _shares[i]);

            unchecked { i++; }
        }
    }

    function isAssetSupported(address assetAddress) public view returns (bool) {
        return false;
    }

    function getTotalDepositedETH() public view returns (uint256 total) {
        return getTotalDepositedInStrategiesInETH() + iTotalAssets();
    }

    function getTotalDepositedInStrategiesInETH() public view returns (uint256 totalAmount) {

        for (uint256 i = 0; i < strategies.length; ) {
            totalAmount += convertToAssets(getTotalDepositedByStrategies(strategies[i]));

            unchecked { i++; }
        }
    }

    function getWithdrawalAmounts(uint256 ethAmount) public view returns (address[] memory, uint256[] memory) {

        uint256 i;
        address[] memory numberOfAssets = iTokens();
        uint256[] memory amounts = new uint256[](numberOfAssets.length);
        uint256[] memory remainingAmounts = new uint256[](numberOfAssets.length);

        // let's withdraw the remaining amount from EL in the current proportions
        if (ethAmount > 0) {
            (, remainingAmounts) = _getWithdrawalAmountsByCurrentProportion(ethAmount);
        }

        for (i = 0; i < numberOfAssets.length; ) {
            amounts[i] += remainingAmounts[i];
            unchecked {
                i++;
            }
        }

        return (numberOfAssets, amounts);
    }


    function _getDepositProportions(
        uint256 ethAmount
    )
        internal
        view
        returns (address[] memory assets, uint256[] memory amounts)
    {
        assets = iTokens();
        uint256 numberOfAssets = assets.length;
        amounts = new uint256[](numberOfAssets);

        for (uint256 i = 0; i < numberOfAssets; ) {
            amounts[i] = iConvertToShares(
                assets[i],
                Convert.multiplyAndDivideFloor(
                    ethAmount,
                    stats[assets[i]].allocation,
                    MAX_ALLOCATION
                )
            );
            unchecked {
                i++;
            }
        }

        return (assets, amounts);
    }

    function _getWithdrawalAmountsByCurrentProportion(uint256 ethAmount) public view returns (address[] memory, uint256[] memory) {

        (, address[] memory assets, uint256[] memory proportions) = getCurrentProportion();

        uint256 numberOfAssets = assets.length;
        uint256[] memory amounts = new uint256[](numberOfAssets);

        uint256 totalDepositedEth = totalAssets();
        if (ethAmount > totalDepositedEth) {
            revert InsufficientCapacity();
        }

        for (uint256 i = 0; i < numberOfAssets; ) {
            amounts[i] = _convertToShares(
                Convert.multiplyAndDivideFloor(
                    ethAmount,
                    proportions[i],
                    MAX_ALLOCATION
                )
            , Math.Rounding.Floor);
            unchecked {
                i++;
            }
        }

        return (assets, amounts);
    }

    function getCurrentProportion() public view returns (uint256, address[] memory assets, uint256[] memory assetProportions) {

        assets = iTokens();
        assetProportions = new uint256[](assets.length);
        uint256 totalDepositedInEth = getTotalDepositedInStrategiesInETH();
        if (totalDepositedInEth == 0) {
            return (MAX_ALLOCATION, assets, assetProportions);
        }
        for (uint256 i = 0; i < assets.length; ) {
            assetProportions[i] = Convert.multiplyAndDivideFloor(
                MAX_ALLOCATION,
                iConvertToAssets(
                    assets[i],
                    getTotalDepositedByStrategies(assets[i])
                ),
                totalDepositedInEth
            );
            unchecked {
                i++;
            }
        }

        return (MAX_ALLOCATION, assets, assetProportions);
    }

    function verifyProportion(uint256[] memory amounts) public view returns (bool) {

        address[] memory assets = iTokens();
        
        uint256 numberOfAssets = assets.length;
        if (numberOfAssets == 0) {
            return false;
        }
        if (numberOfAssets != amounts.length) {
            return false;
        }

        uint256 newTotalEth = getTotalDepositedInStrategiesInETH();
        uint256 i;
        for (i = 0; i < assets.length; ) {
            newTotalEth += iConvertToAssets(assets[i], amounts[i]);
            unchecked {
                i++;
            }
        }
        (, , uint256[] memory proportions) = getCurrentProportion();

        for (i = 0; i < assets.length; ) {
            address assetAddress = assets[i];
            uint256 assetTarget = stats[assets[i]].allocation;
            // calculate a new value of stEth in ETH:
            uint256 currentAssetAmountInETH = iConvertToAssets(
                assetAddress,
                getTotalDepositedByStrategies(assetAddress)
            );
            uint256 currentProportionDiff = assetTarget > proportions[i]
                ? assetTarget - proportions[i]
                : proportions[i] - assetTarget;
            uint256 assetNewTotalAmount = currentAssetAmountInETH +
                iConvertToAssets(assetAddress, amounts[i]);

            uint256 assetNewProportion = Convert.multiplyAndDivideFloor(
                MAX_ALLOCATION,
                assetNewTotalAmount,
                newTotalEth
            );

            uint256 newProportionDiff = assetTarget > assetNewProportion
                ? assetTarget - assetNewProportion
                : assetNewProportion - assetTarget;

            if (newProportionDiff > currentProportionDiff) {
                if (
                    ((assetTarget - tolerance >=
                        assetNewProportion) ||
                        (assetNewProportion >=
                            assetTarget + tolerance))
                ) {
                    return false;
                }
            }
            unchecked {
                i++;
            }
        }

        return true;
    }

    // --- EIP4626 ---
    function totalAssets() public view virtual override returns (uint256) { // getTotalDepositedETH
        uint256 assetInVault = IERC20(asset()).balanceOf(address(this)) - getVaultYield();
        uint256 assetInStrategies = totalDeposit;
        return _convertToAssets(assetInVault +assetInStrategies, Math.Rounding.Floor);
    }

    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view virtual override returns (uint256) {
        return ratioAdapter.toValue(asset(), assets).mulDiv(totalSupply() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
    }

    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view virtual override returns (uint256) {
        return shares.mulDiv(totalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
    }

    // --- MetaLRTCore ---
    function getBalance() public view virtual override returns (uint256) {
        uint256 assetInVault = IERC20(asset()).balanceOf(address(this));
        uint256 assetInStrategies = totalDeposit;
        return ratioAdapter.toValue(asset(), assetInVault + assetInStrategies);
    }
}
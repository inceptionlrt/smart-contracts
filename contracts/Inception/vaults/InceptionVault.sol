// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../eigenlayer-handler/EigenLayerHandler.sol";

import "../../interfaces/IInceptionVault.sol";
import "../../interfaces/IInceptionToken.sol";
import "../../interfaces/IRebalanceStrategy.sol";

contract InceptionVault is IInceptionVault, EigenLayerHandler {
    /// @dev Inception re-staking token
    IInceptionToken public inceptionToken;

    /// @dev reduce rounding issues
    uint256 public minAmount;

    /// @dev epoch represents the period of the rebalancing process
    /// @dev receiver is a receiver of assets on claim()
    /// @dev amount represents the exact amount of asset
    struct Withdrawal {
        uint256 epoch;
        address receiver;
        uint256 amount;
        uint256 iShares;
    }

    mapping(address => Withdrawal) private _claimerWithdrawals;

    function __InceptionVault_init(
        address operatorAddress,
        IStrategyManager _strategyManager,
        IInceptionToken _inceptionToken,
        IStrategy _assetStrategy
    ) internal {
        __Ownable_init();
        __EigenLayerHandler_init(_strategyManager, _assetStrategy);

        _operator = operatorAddress;
        inceptionToken = _inceptionToken;

        minAmount = 100;
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    /// @dev deposits the provided assets directly into EigenLayer
    /// @notice verify the proportion via verifyProportion()
    function deposit(
        uint256 amount,
        address receiver
    ) public nonReentrant returns (uint256) {
        if (receiver == address(0)) {
            revert NullParams();
        }
        require(
            amount >= minAmount,
            "InceptionVault: deposited less than min amount"
        );
        address sender = msg.sender;
        uint256 currentRatio = ratio();
        uint256 depositedBefore = getTotalDeposited();
        // get the asset amount from the sender
        _transferAssetFrom(sender, amount);
        // deposit assets to EIGEN LAYER strategies
        _depositAssetToEL(amount);
        uint256 depositedAmount = getTotalDeposited() - depositedBefore;

        uint256 iShares = Convert.multiplyAndDivideFloor(
            depositedAmount,
            currentRatio,
            1e18
        );
        inceptionToken.mint(receiver, iShares);

        emit Deposit(sender, receiver, depositedAmount, iShares);

        return iShares;
    }

    // /*/////////////////////////////////
    // ////// Withdrawal functions //////
    // ///////////////////////////////*/

    /// @dev performs burning iToken from mgs.sender
    /// @dev creates a withdrawal requests based on the current assets targets
    /// @dev 1. Withdraw: from Vault -> decrease the rebalance diff
    /// @dev 2. Withdraw: from Vault + EL -> current proportion in Vault(the whole balance) + adjust the EL proportion -> expensive
    /// @param iShares is measured in Inception token(shares)
    function withdraw(uint256 iShares, address receiver) external nonReentrant {
        if (iShares == 0) {
            revert NullParams();
        }
        if (receiver == address(0)) {
            revert NullParams();
        }
        address owner = msg.sender;
        uint256 amount = Convert.multiplyAndDivideFloor(iShares, 1e18, ratio());
        require(
            amount >= minAmount,
            "InceptionVault: amount is less than the minimum withdrawal"
        );
        // burn Inception token in view of the current ratio
        inceptionToken.burn(owner, iShares);

        // update global state and claimer's state
        totalAmountToWithdraw += amount;
        Withdrawal storage request = _claimerWithdrawals[receiver];
        request.amount += _getAssetReceivedAmount(amount);
        request.iShares += iShares;
        request.receiver = receiver;
        request.epoch = epoch;

        emit Withdraw(owner, receiver, owner, amount, iShares);
    }

    /// @dev performs claiming of a withdrawal request
    /// @notice checks isAbleToRedeem() function
    /// @notice everyone is able to claim for a proper claimer
    /// @param receiver represents the receiver of a withdrawal request
    function redeem(address receiver) public nonReentrant {
        require(
            isAbleToRedeem(receiver),
            "InceptionVault: claimer is not able to claim"
        );
        Withdrawal storage request = _claimerWithdrawals[receiver];
        uint256 amount = request.amount;
        /// @notice Ensure the ratio has decreased since the user's withdrawal
        uint256 currentAmount = Convert.multiplyAndDivideFloor(
            request.iShares,
            1e18,
            ratio()
        );
        if (currentAmount < amount) amount = currentAmount;
        totalAmountToWithdraw -= amount;

        delete _claimerWithdrawals[receiver];
        _transferAssetTo(receiver, amount);

        emit Redeem(msg.sender, receiver, amount);
    }

    function getPendingWithdrawalOf(
        address claimer
    ) public view returns (uint256, address) {
        Withdrawal memory withdrawal = _claimerWithdrawals[claimer];
        return (withdrawal.amount, withdrawal.receiver);
    }

    /// @dev same examples:
    /// epoch 0 -- rebalance is not in progress, claimer1 withdrew
    /// epoch 1 -- rebalance in progress, claimer2 withdrew
    /// epoch 2 -- rebalance is finished, claimer1 is able to claim
    /// epoch 3 -- rebalance in progress
    /// epoch 4 -- rebalance is finished, claimer2 is able to claim
    function isAbleToRedeem(address claimer) public view returns (bool) {
        Withdrawal storage request = _claimerWithdrawals[claimer];
        // the request is empty
        if (request.amount == 0) {
            return false;
        }
        if (request.amount > totalAssets()) {
            return false;
        }
        // a claimer withdrew during the rebalance
        if (request.epoch % 2 != 0) {
            if (epoch - request.epoch < 3) {
                return false;
            }
        } else {
            if (epoch - request.epoch < 2) {
                return false;
            }
        }

        return true;
    }

    function ratio() public view returns (uint256) {
        // take into account pending withdrawn amount
        uint256 denominator = getTotalDeposited() < totalAmountToWithdraw
            ? 0
            : getTotalDeposited() - totalAmountToWithdraw;
        if (
            denominator == 0 ||
            IERC20(address(inceptionToken)).totalSupply() == 0
        ) {
            return 1e18;
        }
        return
            Convert.multiplyAndDivideCeil(
                IERC20(address(inceptionToken)).totalSupply(),
                1e18,
                denominator
            );
    }

    function convertToShares(
        uint256 assets
    ) public view returns (uint256 shares) {
        return Convert.multiplyAndDivideFloor(assets, ratio(), 1e18);
    }

    function convertToAssets(
        uint256 iShares
    ) public view returns (uint256 assets) {
        return Convert.multiplyAndDivideFloor(iShares, 1e18, ratio());
    }

    /*//////////////////////////
    ////// SET functions //////
    ////////////////////////*/

    function setOperator(address newValue) external onlyOwner {
        emit OperatorChanged(_operator, newValue);
        _operator = newValue;
    }

    function setMinAmount(uint256 newMinAmount) external onlyOwner {
        emit MinAmountChanged(minAmount, newMinAmount);
        minAmount = newMinAmount;
    }
}

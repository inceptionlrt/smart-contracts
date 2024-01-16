// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../eigenlayer-handler/EigenLayerHandler.sol";

import "../../interfaces/IInceptionVault.sol";
import "../../interfaces/IInceptionToken.sol";
import "../../interfaces/IRebalanceStrategy.sol";

/// @author The InceptionLRT team
/// @title The InceptionVault maximizes the profit of EigenLayer for the certain asset
contract InceptionVault is IInceptionVault, EigenLayerHandler {
    /// @dev Inception re-staking token
    IInceptionToken public inceptionToken;

    /// @dev reduces rounding issues
    uint256 public minAmount;

    /// @dev epoch represents the period of the rebalancing process
    /// @dev receiver is a receiver of assets in claim()
    /// @dev amount represents the exact amount of the asset to be claimed
    struct Withdrawal {
        uint256 epoch;
        address receiver;
        uint256 amount;
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

    function __beforeDeposit(address receiver, uint256 amount) internal view {
        if (receiver == address(0)) {
            revert NullParams();
        }
        require(
            amount >= minAmount,
            "InceptionVault: deposited less than min amount"
        );
    }

    /// @dev transfers the msg.sender's assets to the vault.
    /// @dev mints Inception tokens in accordance with the current ratio.
    /// @dev issues the tokens to the specified receiver address.
    function deposit(
        uint256 amount,
        address receiver
    ) public nonReentrant whenNotPaused returns (uint256) {
        address sender = msg.sender;
        uint256 currentRatio = ratio();

        // transfers assets from the sender and returns the received amount
        // the actual received amount might slightly differ from the specified amount,
        // approximately by -2
        amount = _deposit(amount, sender, receiver);

        uint256 iShares = Convert.multiplyAndDivideFloor(
            amount,
            currentRatio,
            1e18
        );
        inceptionToken.mint(receiver, iShares);

        emit Deposit(sender, receiver, amount, iShares);

        return iShares;
    }

    function _deposit(
        uint256 amount,
        address sender,
        address receiver
    ) internal returns (uint256) {
        __beforeDeposit(receiver, amount);
        uint256 depositedBefore = totalAssets();
        // get the amount from the sender
        _transferAssetFrom(sender, amount);

        return totalAssets() - depositedBefore;
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
        request.receiver = receiver;
        request.epoch = epoch;

        emit Withdraw(owner, receiver, owner, amount, iShares);
    }

    /// @dev performs the claiming of a withdrawal request
    /// @notice checks isAbleToRedeem() to ensure that the receiver is ready to claim
    /// @notice allows anyone to claim on behalf of the correct receiver
    /// @param receiver Represents the receiver of the withdrawal request
    function redeem(address receiver) public nonReentrant {
        require(
            isAbleToRedeem(receiver),
            "InceptionVault: claimer is not able to claim"
        );
        Withdrawal storage request = _claimerWithdrawals[receiver];
        uint256 amount = request.amount;
        totalAmountToWithdraw -= amount;

        delete _claimerWithdrawals[receiver];
        _transferAssetTo(receiver, amount);

        emit Redeem(msg.sender, receiver, amount);
    }

    /// @dev returns the amount of assets to be claimed and the receiver
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

    /*///////////////////////////////
    ////// Pausable functions //////
    /////////////////////////////*/

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../InceptionVaultStorage_EL.sol";

contract ERC4626Facet_EL is InceptionVaultStorage_EL {
    function __beforeDeposit(address receiver, uint256 amount) internal view {
        if (receiver == address(0)) revert NullParams();
        if (amount < minAmount) revert LowerMinAmount(minAmount);
        if (targetCapacity == 0) revert InceptionOnPause();
        if (!_verifyDelegated()) revert InceptionOnPause();
    }

    function __afterDeposit(uint256 iShares) internal pure {
        if (iShares == 0) revert DepositInconsistentResultedState();
    }

    /// @dev Transfers the msg.sender's assets to the vault.
    /// @dev Mints Inception tokens in accordance with the current ratio.
    /// @dev Issues the tokens to the specified receiver address.
    function deposit(
        uint256 amount,
        address receiver
    ) public whenNotPaused returns (uint256) {
        return _deposit(amount, msg.sender, receiver);
    }

    /**
     * @dev The `mint` function is used to mint the specified amount of shares
     * in
     * exchange of the corresponding assets amount from owner.
     * @param shares The shares amount to be converted into underlying assets.
     * @param receiver The address of the shares receiver.
     * @return Amount of underlying assets deposited in exchange of the
     * specified
     * amount of shares.
     */
    function mint(
        uint256 shares,
        address receiver
    ) public whenNotPaused returns (uint256) {
        uint256 maxShares = maxMint(receiver);
        if (shares > maxShares) {
            //  revert ERC4626ExceededMaxMint(receiver, shares, maxShares);
        }

        uint256 assetsAmount = previewMint(shares);
        _deposit(assetsAmount, msg.sender, receiver);

        return assetsAmount;
    }

    /// @notice The deposit function but with a referral code
    function depositWithReferral(
        uint256 amount,
        address receiver,
        bytes32 code
    ) external whenNotPaused returns (uint256) {
        emit IInceptionVault_EL.ReferralCode(code);
        return _deposit(amount, msg.sender, receiver);
    }

    function _deposit(
        uint256 amount,
        address sender,
        address receiver
    ) internal returns (uint256) {
        // transfers assets from the sender and returns the received amount
        // the actual received amount might slightly differ from the specified amount,
        // approximately by -2 wei
        __beforeDeposit(receiver, amount);
        uint256 depositedBefore = totalAssets();
        uint256 depositBonus;
        uint256 availableBonusAmount = depositBonusAmount;
        if (availableBonusAmount > 0) {
            depositBonus = 0;
            if (depositBonus > availableBonusAmount) {
                depositBonus = availableBonusAmount;
                depositBonusAmount = 0;
            } else {
                depositBonusAmount -= depositBonus;
            }
            emit IInceptionVault_EL.DepositBonus(depositBonus);
        }
        // get the amount from the sender
        _transferAssetFrom(sender, amount);
        amount = totalAssets() - depositedBefore;
        uint256 iShares = convertToShares(amount + depositBonus);
        inceptionToken.mint(receiver, iShares);
        __afterDeposit(iShares);
        emit IInceptionVault_EL.Deposit(sender, receiver, amount, iShares);
        return iShares;
    }

    function __beforeWithdraw(address receiver, uint256 iShares) internal view {
        if (iShares == 0) revert NullParams();
        if (receiver == address(0)) revert NullParams();
        if (targetCapacity == 0) revert InceptionOnPause();
        if (treasury == address(0)) revert InceptionOnPause();
        if (!_verifyDelegated()) revert InceptionOnPause();
    }

    /// @dev Performs burning iToken from mgs.sender
    /// @dev Creates a withdrawal requests based on the current ratio
    /// @param iShares is measured in Inception token(shares)
    function withdraw(uint256 iShares, address receiver) external {
        __beforeWithdraw(receiver, iShares);
        address claimer = msg.sender;
        uint256 amount = convertToAssets(iShares);
        if (amount < minAmount) revert LowerMinAmount(minAmount);

        // burn Inception token in view of the current ratio
        inceptionToken.burn(claimer, iShares);

        // update global state and claimer's state
        totalAmountToWithdraw += amount;
        IInceptionVault_EL.Withdrawal storage genRequest = _claimerWithdrawals[
            receiver
        ];
        genRequest.amount += (amount - 2);
        claimerWithdrawalsQueue.push(
            IInceptionVault_EL.Withdrawal({
                epoch: claimerWithdrawalsQueue.length,
                receiver: receiver,
                amount: (amount - 2)
            })
        );

        emit IInceptionVault_EL.Withdraw(
            claimer,
            receiver,
            claimer,
            amount,
            iShares
        );
    }

    function flashWithdraw(uint256 iShares, address receiver) external {
        __beforeWithdraw(receiver, iShares);

        address claimer = msg.sender;
        uint256 amount = convertToAssets(iShares);

        if (amount < minAmount) revert LowerMinAmount(minAmount);

        // burn Inception token in view of the current ratio
        inceptionToken.burn(claimer, iShares);

        uint256 fee = calculateFlashWithdrawFee(amount);
        if (fee == 0) revert ZeroFlashWithdrawFee();
        uint256 protocolWithdrawalFee = (fee * protocolFee) / MAX_PERCENT;

        amount -= fee;
        depositBonusAmount += (fee - protocolWithdrawalFee);

        /// @notice instant transfer fee to the treasury
        _transferAssetTo(treasury, protocolWithdrawalFee);
        /// @notice instant transfer amount to the receiver
        _transferAssetTo(receiver, amount);

        emit IInceptionVault_EL.FlashWithdraw(
            claimer,
            receiver,
            claimer,
            amount,
            iShares,
            fee
        );
    }

    function redeem(address receiver) external {
        (bool isAble, uint256[] memory availableWithdrawals) = isAbleToRedeem(
            receiver
        );
        if (!isAble) revert IsNotAbleToRedeem();

        uint256 numOfWithdrawals = availableWithdrawals.length;
        uint256[] memory redeemedWithdrawals = new uint256[](numOfWithdrawals);

        IInceptionVault_EL.Withdrawal storage genRequest = _claimerWithdrawals[
            receiver
        ];
        uint256 redeemedAmount;
        for (uint256 i = 0; i < numOfWithdrawals; ++i) {
            uint256 withdrawalNum = availableWithdrawals[i];
            IInceptionVault_EL.Withdrawal
                storage request = claimerWithdrawalsQueue[withdrawalNum];
            uint256 amount = request.amount;
            // update the genRequest and the global state
            genRequest.amount -= amount;

            totalAmountToWithdraw -= amount;
            redeemReservedAmount -= amount;
            redeemedAmount += amount;
            redeemedWithdrawals[i] = withdrawalNum;

            delete claimerWithdrawalsQueue[availableWithdrawals[i]];
        }

        // let's update the lowest epoch associated with the claimer
        genRequest.epoch = availableWithdrawals[numOfWithdrawals - 1];

        _transferAssetTo(receiver, redeemedAmount);

        emit IInceptionVault_EL.RedeemedRequests(redeemedWithdrawals);
        emit IInceptionVault_EL.Redeem(msg.sender, receiver, redeemedAmount);
    }

    function _verifyDelegated() internal view returns (bool) {
        for (uint256 i = 0; i < restakers.length; i++) {
            if (restakers[i] == address(0)) {
                continue;
            }
            if (!delegationManager.isDelegated(restakers[i])) return false;
        }

        if (
            strategy.userUnderlyingView(address(this)) > 0 &&
            !delegationManager.isDelegated(address(this))
        ) return false;

        return true;
    }
}

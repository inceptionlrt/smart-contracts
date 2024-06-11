// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "../assets-handler/InceptionAssetsHandler.sol";

import "../../interfaces/IOwnable.sol";
import "../../interfaces/IInceptionOmniVault.sol";
import "../../interfaces/IInceptionToken.sol";

/// @author The InceptionLRT team
/// @title The InceptionOmniVault contract
contract InceptionOmniVault is IInceptionVault, InceptionAssetsHandler {
    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    uint256 public minAmount;

    /// @dev the unique InceptionVault name
    string public name;

    /// @dev inception operator
    address internal _operator;

    function __InceptionVault_init(
        string memory vaultName,
        address operatorAddress,
        IInceptionToken _inceptionToken
    ) internal {
        __Ownable_init();

        name = vaultName;
        _operator = operatorAddress;
        inceptionToken = _inceptionToken;

        minAmount = 100;
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    function __beforeDeposit(address receiver, uint256 amount) internal view {
        if (receiver == address(0)) revert NullParams();
        require(
            amount >= minAmount,
            "InceptionVault: deposited less than min amount"
        );
    }

    function __afterDeposit(uint256 iShares) internal pure {
        require(iShares > 0, "InceptionVault: result iShares 0");
    }

    /// @dev Transfers the msg.sender's assets to the vault.
    /// @dev Mints Inception tokens in accordance with the current ratio.
    /// @dev Issues the tokens to the specified receiver address.
    function deposit(
        uint256 amount,
        address receiver
    ) public nonReentrant whenNotPaused returns (uint256) {
        return _deposit(amount, msg.sender, receiver);
    }

    /// @notice The deposit function but with a referral code
    function depositWithReferral(
        uint256 amount,
        address receiver,
        bytes32 code
    ) public nonReentrant whenNotPaused returns (uint256) {
        emit ReferralCode(code);
        return _deposit(amount, msg.sender, receiver);
    }

    function _deposit(
        uint256 amount,
        address sender,
        address receiver
    ) internal returns (uint256) {
        uint256 currentRatio = ratio();
        // transfers assets from the sender and returns the received amount
        // the actual received amount might slightly differ from the specified amount,
        // approximately by -2 wei
        __beforeDeposit(receiver, amount);
        uint256 depositedBefore = totalAssets();
        // get the amount from the sender
        _transferAssetFrom(sender, amount);
        amount = totalAssets() - depositedBefore;

        uint256 iShares = Convert.multiplyAndDivideFloor(
            amount,
            currentRatio,
            1e18
        );
        inceptionToken.mint(receiver, iShares);
        __afterDeposit(iShares);

        emit Deposit(sender, receiver, amount, iShares);

        return iShares;
    }

    /*///////////////////////////////////////
    ///////// Withdrawal functions /////////
    /////////////////////////////////////*/

    function __beforeWithdraw(address receiver, uint256 iShares) internal view {
        if (iShares == 0) {
            revert NullParams();
        }
        if (receiver == address(0)) {
            revert NullParams();
        }
    }

    /// @dev Performs burning iToken from mgs.sender
    /// @param iShares is measured in Inception token(shares)
    function withdraw(
        uint256 iShares,
        address receiver
    ) external whenNotPaused nonReentrant {
        __beforeWithdraw(receiver, iShares);
        address claimer = msg.sender;
        uint256 amount = Convert.multiplyAndDivideFloor(iShares, 1e18, ratio());
        require(
            amount >= minAmount,
            "InceptionVault: amount is less than the minimum withdrawal"
        );
        // burn Inception token in view of the current ratio
        inceptionToken.burn(claimer, iShares);
        _transferAssetTo(receiver, _getAssetReceivedAmount(amount));

        emit Withdraw(claimer, receiver, claimer, amount, iShares);
    }

    function ratio() public view returns (uint256) {
        uint256 totalDeposited = totalAssets();
        uint256 totalSupply = IERC20(address(inceptionToken)).totalSupply();
        uint256 denominator = totalDeposited;

        if (denominator == 0 || totalSupply == 0) return 1e18;

        return Convert.multiplyAndDivideCeil(totalSupply, 1e18, denominator);
    }

    /*//////////////////////////////
    ////// Convert functions //////
    ////////////////////////////*/

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

    function setOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) {
            revert NullParams();
        }
        emit OperatorChanged(_operator, newOperator);
        _operator = newOperator;
    }

    function setMinAmount(uint256 newMinAmount) external onlyOwner {
        emit MinAmountChanged(minAmount, newMinAmount);
        minAmount = newMinAmount;
    }

    function setName(string memory newVaultName) external onlyOwner {
        if (bytes(newVaultName).length == 0) {
            revert NullParams();
        }
        emit NameChanged(name, newVaultName);
        name = newVaultName;
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../assets-handler/InceptionOmniAssetHandler.sol";

import "../../interfaces/IOwnable.sol";
import "../../interfaces/IInceptionVault.sol";
import "../../interfaces/IInceptionToken.sol";
import "../../interfaces/IRebalanceStrategy.sol";
import "../../interfaces/IInceptionRatioFeed.sol";

/// @author The InceptionLRT team
/// @title The InceptionOmniVault contract
contract InceptionOmniVault is IInceptionVault, InceptionOmniAssetsHandler {
    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    uint256 public minAmount;

    /// @dev the unique InceptionVault name
    string public name;

    /**
     *  @dev Flash withdrawal params
     */
    address public treasuryAddress;
    IInceptionRatioFeed public ratioFeed;

    uint256 public baseRate;
    uint256 public optimalRate;
    uint256 public targetCapacity;

    uint256 internal _depositBonusAmount;

    uint256 public constant BASE_RATE = 0.005 * 1e18; // 0.5%
    uint256 public constant OPTIMAL_RATE = 0.015 * 1e18; // 1.5%
    uint256 public constant MAX_RATE = 0.03 * 1e18; // 3%
    uint256 public constant MIN_STAKING_BONUS = 0.001 * 1e18; // 0.1%
    uint256 public constant MAX_STAKING_BONUS = 0.005 * 1e18; // 0.5%
    uint256 public constant slope1_fee = 0.005 * 1e18;

    function __InceptionOmniVault_init(
        string memory vaultName,
        IInceptionToken _inceptionToken
    ) internal {
        __Ownable_init();

        name = vaultName;
        inceptionToken = _inceptionToken;

        minAmount = 100;

        /// TODO
        treasuryAddress = msg.sender;
    }

    /*//////////////////////////////
    ////// Deposit functions //////
    ////////////////////////////*/

    function __beforeDeposit(address receiver, uint256 amount) internal view {
        if (receiver == address(0)) revert NullParams();
        if (amount < minAmount) revert LowerMinAmount(minAmount);
    }

    function __afterDeposit(uint256 iShares) internal pure {
        require(iShares > 0, "InceptionVault: result iShares 0");
    }

    /// @dev Transfers the msg.sender's assets to the vault.
    /// @dev Mints Inception tokens in accordance with the current ratio.
    /// @dev Issues the tokens to the specified receiver address.
    function deposit(
        address receiver
    ) public payable nonReentrant whenNotPaused returns (uint256) {
        return _deposit(msg.value, msg.sender, receiver);
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
        uint256 depositBonus;
        if (_depositBonusAmount > 0) {
            depositBonus = calculateDepositBonus(amount);
            if (depositBonus > _depositBonusAmount) {
                depositBonus = _depositBonusAmount;
                _depositBonusAmount = 0;
            } else {
                _depositBonusAmount -= depositBonus;
            }
            emit DepositBonus(depositBonus);
        }

        uint256 iShares = Convert.multiplyAndDivideFloor(
            amount + depositBonus,
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

    /*/////////////////////////////////////////////
    ///////// Flash Withdrawal functions /////////
    ///////////////////////////////////////////*/

    /// @dev Performs burning iToken from mgs.sender
    /// @dev Creates a withdrawal requests based on the current ratio
    /// @param iShares is measured in Inception token(shares)
    function flashWithdraw(
        uint256 iShares,
        address receiver
    ) external whenNotPaused nonReentrant {
        __beforeWithdraw(receiver, iShares);

        address claimer = msg.sender;
        uint256 currentRatio = ratio();
        uint256 amount = Convert.multiplyAndDivideFloor(
            iShares,
            1e18,
            currentRatio
        );
        uint256 capacity = totalAssets() - _depositBonusAmount;

        if (amount < minAmount) revert LowerMinAmount(minAmount);
        if (amount > capacity) revert InsufficientCapacity(capacity);

        // burn Inception token in view of the current ratio
        inceptionToken.burn(claimer, iShares);

        uint256 fee = calculateFlashUnstakeFee(amount);
        emit FlashWithdrawFee(fee);

        amount -= fee;
        _depositBonusAmount += fee / 2;

        /// @notice instant transfer fee to the treasuryAddress
        _transferAssetTo(treasuryAddress, fee / 2);
        /// @notice instant transfer amount to the receiver
        _transferAssetTo(receiver, amount);

        emit Withdraw(claimer, receiver, claimer, amount, iShares);
    }

    /// @notice Function to calculate deposit bonus based on the utilization rate
    function calculateDepositBonus(
        uint256 amount
    ) public view returns (uint256) {
        uint256 utilization = (getFlashCapacity() * 1e18) / targetCapacity;
        if (utilization <= 0.25 * 1e18) {
            return (amount * MAX_STAKING_BONUS) / 1e18; // 0.5%
        } else if (utilization < 1e18) {
            return
                (amount * ((MAX_STAKING_BONUS + MIN_STAKING_BONUS) / 2)) / 1e18;
        } else {
            return 0;
        }
    }

    /// @dev Function to calculate flash withdrawal fee based on the utilization rate
    function calculateFlashUnstakeFee(
        uint256 amount
    ) public view returns (uint256) {
        uint256 utilization = (getFlashCapacity() * 1e18) / targetCapacity;
        if (utilization <= 1e18) {
            return Convert.multiplyAndDivideFloor(amount, MAX_RATE, 1e18);
        } else if (utilization <= 0.25 * 1e18) {
            uint256 coeff = slope1_fee -
                ((utilization - 0.25 * 1e18) * (MAX_RATE - slope1_fee)) /
                (0.25 * 1e18);
            return Convert.multiplyAndDivideFloor(amount, coeff, 1e18);
        }
        return 0;
    }

    /*//////////////////////////////
    ////// Factory functions //////
    ////////////////////////////*/

    function ratio() public view returns (uint256) {
        uint256 totalDeposited = getTotalDeposited();
        uint256 totalSupply = IERC20(address(inceptionToken)).totalSupply();
        // take into account the pending withdrawn amount
        if (totalDeposited == 0 || totalSupply == 0) return 1e18;

        return Convert.multiplyAndDivideCeil(totalSupply, 1e18, totalDeposited);
    }

    /// @dev returns the total deposited
    function getTotalDeposited() public view returns (uint256) {
        return
            totalAssets() -
            _depositBonusAmount;
    }

    function getFlashCapacity() public view returns (uint256 total) {
        return totalAssets() - _depositBonusAmount;
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

    function setRatioFeed(IInceptionRatioFeed newRatioFeed) external onlyOwner {
        if (address(newRatioFeed) == address(0)) revert NullParams();

        emit RatioFeedChanged(address(ratioFeed), address(newRatioFeed));
        ratioFeed = newRatioFeed;
    }

    function setMinAmount(uint256 newMinAmount) external onlyOwner {
        emit MinAmountChanged(minAmount, newMinAmount);
        minAmount = newMinAmount;
    }

    function setName(string memory newVaultName) external onlyOwner {
        if (bytes(newVaultName).length == 0) revert NullParams();

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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "../eigenlayer-handler/EigenLayerHandler.sol";

import "../../interfaces/IOwnable.sol";
import "../../interfaces/IInceptionVault.sol";
import "../../interfaces/IInceptionToken.sol";
import "../../interfaces/IRebalanceStrategy.sol";
import "../../interfaces/IDelegationManager.sol";

/// @author The InceptionLRT team
/// @title The InceptionVault contract
/// @notice Aims to maximize the profit of EigenLayer for a certain asset.
contract InceptionVault is IInceptionVault, EigenLayerHandler {
    /// @dev Inception restaking token
    IInceptionToken public inceptionToken;

    /// @dev Reduces rounding issues
    uint256 public minAmount;

    mapping(address => Withdrawal) private _claimerWithdrawals;

    /// @dev the unique InceptionVault name
    string public name;

    /// @dev Factory variables
    address private _stakerImplementation;

    function __InceptionVault_init(
        string memory vaultName,
        address operatorAddress,
        IStrategyManager _strategyManager,
        IInceptionToken _inceptionToken,
        IStrategy _assetStrategy
    ) internal {
        __Ownable_init();
        __EigenLayerHandler_init(_strategyManager, _assetStrategy);

        name = vaultName;
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

        emit Deposit(sender, receiver, amount, iShares);

        return iShares;
    }

    /*/////////////////////////////////
    ////// Delegation functions //////
    ///////////////////////////////*/

    function delegateToOperator(
        uint256 amount,
        address elOperator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) external nonReentrant whenNotPaused onlyOperator {
        if (elOperator == address(0)) {
            revert NullParams();
        }
        _beforeDepositAssetIntoStrategy(amount);

        // try to find a restaker for the specific EL operator
        address restaker = _operatorRestakers[elOperator];
        if (restaker == address(0)) {
            revert OperatorNotRegistered();
        }

        bool delegate = false;
        if (restaker == _MOCK_ADDRESS) {
            delegate = true;
            // deploy a new restaker
            restaker = _deployNewStub();
            _operatorRestakers[elOperator] = restaker;
            restakers.push(restaker);
        }

        _depositAssetIntoStrategy(restaker, amount);

        if (delegate)
            _delegateToOperator(
                restaker,
                elOperator,
                approverSalt,
                approverSignatureAndExpiry
            );

        emit DelegatedTo(restaker, elOperator, amount);
    }

    function delegateToOperatorFromVault(
        uint256 amount,
        address elOperator,
        bytes32 approverSalt,
        IDelegationManager.SignatureWithExpiry memory approverSignatureAndExpiry
    ) external nonReentrant whenNotPaused onlyOperator {
        if (elOperator == address(0)) {
            revert NullParams();
        }
        if (delegationManager.delegatedTo(address(this)) != address(0))
            revert AlreadyDelegated();

        _delegateToOperatorFromVault(
            elOperator,
            approverSalt,
            approverSignatureAndExpiry
        );

        emit DelegatedTo(address(this), elOperator, amount);
    }

    /*///////////////////////////////////////
    ///////// Withdrawal functions /////////
    /////////////////////////////////////*/

    function __beforeWithdraw(address receiver, uint256 iShares) internal pure {
        if (iShares == 0) {
            revert NullParams();
        }
        if (receiver == address(0)) {
            revert NullParams();
        }
    }

    /// @dev Performs burning iToken from mgs.sender
    /// @dev Creates a withdrawal requests based on the current ratio
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

        // update global state and claimer's state
        totalAmountToWithdraw += amount;
        Withdrawal storage genRequest = _claimerWithdrawals[receiver];
        genRequest.amount += _getAssetReceivedAmount(amount);
        claimerWithdrawalsQueue.push(
            Withdrawal({
                epoch: claimerWithdrawalsQueue.length,
                receiver: receiver,
                amount: _getAssetReceivedAmount(amount)
            })
        );

        emit Withdraw(claimer, receiver, claimer, amount, iShares);
    }

    function redeem(address receiver) public whenNotPaused nonReentrant {
        (bool isAble, uint256[] memory availableWithdrawals) = isAbleToRedeem(
            receiver
        );
        require(isAble, "InceptionVault: redeem can not be proceed");

        uint256 numOfWithdrawals = availableWithdrawals.length;
        uint256[] memory redeemedWithdrawals = new uint256[](numOfWithdrawals);

        Withdrawal storage genRequest = _claimerWithdrawals[receiver];
        uint256 redeemedAmount;
        for (uint256 i = 0; i < numOfWithdrawals; ) {
            uint256 withdrawalNum = availableWithdrawals[i];
            Withdrawal memory request = claimerWithdrawalsQueue[withdrawalNum];
            uint256 amount = request.amount;
            // update the genRequest and the global state
            genRequest.amount -= amount;

            totalAmountToWithdraw -= _getAssetWithdrawAmount(amount);
            redeemReservedAmount -= amount;
            redeemedAmount += amount;
            redeemedWithdrawals[i] = withdrawalNum;

            delete claimerWithdrawalsQueue[availableWithdrawals[i]];
            unchecked {
                ++i;
            }
        }

        // let's update the lowest epoch associated with the claimer
        genRequest.epoch = availableWithdrawals[numOfWithdrawals - 1];

        _transferAssetTo(receiver, redeemedAmount);

        emit RedeemedRequests(redeemedWithdrawals);
        emit Redeem(msg.sender, receiver, redeemedAmount);
    }

    /*//////////////////////////////
    ////// Factory functions //////
    ////////////////////////////*/

    function _deployNewStub() internal returns (address) {
        if (_stakerImplementation == address(0)) {
            revert ImplementationNotSet();
        }
        // deploy new beacon proxy and do init call
        bytes memory data = abi.encodeWithSignature(
            "initialize(address,address,address,address)",
            delegationManager,
            strategyManager,
            strategy,
            _operator
        );
        address deployedAddress = address(new BeaconProxy(address(this), data));

        IOwnable asOwnable = IOwnable(deployedAddress);
        asOwnable.transferOwnership(owner());

        emit RestakerDeployed(deployedAddress);
        return deployedAddress;
    }

    function implementation() external view returns (address) {
        return _stakerImplementation;
    }

    function upgradeTo(
        address newImplementation
    ) external whenNotPaused onlyOwner {
        require(
            Address.isContract(newImplementation),
            "InceptionVault: implementation is not a contract"
        );
        emit ImplementationUpgraded(_stakerImplementation, newImplementation);
        _stakerImplementation = newImplementation;
    }

    function isAbleToRedeem(
        address claimer
    ) public view returns (bool able, uint256[] memory) {
        // get the general request
        uint256 index;
        Withdrawal memory genRequest = _claimerWithdrawals[claimer];
        uint256 from = genRequest.epoch;
        uint256[] memory availableWithdrawals = new uint256[](epoch - from);
        if (genRequest.amount == 0) {
            return (false, availableWithdrawals);
        }

        for (uint256 i = 0; i < epoch; ) {
            if (claimerWithdrawalsQueue[i].receiver == claimer) {
                able = true;
                availableWithdrawals[index] = i;
                ++index;
            }
            unchecked {
                ++i;
            }
        }

        // decrease arrays
        if (availableWithdrawals.length - index > 0) {
            assembly {
                mstore(availableWithdrawals, index)
            }
        }

        return (able, availableWithdrawals);
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

    /// @dev returns the total deposited into asset strategy
    function getTotalDeposited() public view returns (uint256) {
        return getTotalDelegated() + totalAssets() + _pendingWithdrawalAmount;
    }

    /// @dev returns the total deposited into asset strategy
    function getTotalDelegated() public view returns (uint256 total) {
        uint256 stakersNum = restakers.length;
        for (uint256 i = 0; i < stakersNum; ) {
            if (restakers[i] == address(0)) {
                continue;
            }
            total += strategy.userUnderlyingView(restakers[i]);
            unchecked {
                ++i;
            }
        }
        return total + strategy.userUnderlyingView(address(this));
    }

    function getDelegatedTo(address elOperator) public view returns (uint256) {
        return strategy.userUnderlyingView(_operatorRestakers[elOperator]);
    }

    function getPendingWithdrawalOf(
        address claimer
    ) public view returns (uint256) {
        return _claimerWithdrawals[claimer].amount;
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

    function addELOperator(address newELOperator) external onlyOwner {
        require(
            delegationManager.isOperator(newELOperator),
            "InceptionVault: it is not an EL operator"
        );
        require(
            _operatorRestakers[newELOperator] == address(0),
            "InceptionVault: operator already exists"
        );

        _operatorRestakers[newELOperator] = _MOCK_ADDRESS;
        emit ELOperatorAdded(newELOperator);
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

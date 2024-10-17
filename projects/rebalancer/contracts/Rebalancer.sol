// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {TransactionStorage} from "./TransactionStorage.sol";
import {IRestakingPool} from "./interfaces/IRestakingPool.sol";
import {IInceptionToken} from "./interfaces/IInceptionToken.sol";
import {IInceptionRatioFeed} from "./interfaces/IInceptionRatioFeed.sol";
import {ICrossChainAdapterL1} from "crosschain-adapters/contracts/interface/ICrossChainAdapterL1.sol";

/**
 * @author The InceptionLRT team
 * @title Rebalancer
 * @dev This contract handles staking, manages treasury data and facilitates cross-chain ETH transfers.
 */
contract Rebalancer is Initializable, OwnableUpgradeable {
    address public inETHAddress;
    address public lockboxAddress;
    address payable public liqPool;
    address public transactionStorage;
    address public ratioFeed;
    address public operator;

    uint256 public constant MULTIPLIER = 1e18;

    modifier onlyOperator() {
        require(msg.sender == operator, OnlyOperator());
        _;
    }

    error TransferToLockboxFailed();
    error InETHAddressNotSet();
    error SettingZeroAddress();
    error LiquidityPoolNotSet();
    error CrosschainAdapterNotSet();
    error MissingOneOrMoreL2Transactions(uint256 chainId);
    error StakeAmountExceedsEthBalance(uint256 staked, uint256 availableEth);
    error SendAmountExceedsEthBalance(uint256 amountToSend);
    error StakeAmountExceedsMaxTVL();
    error OnlyOperator();
    error NoRebalancingRequired();

    event ETHReceived(address sender, uint256 amount);
    event InETHDepositedToLockbox(uint256 mintAmount);
    event TreasuryUpdateMint(uint256 mintAmount);
    event TreasuryUpdateBurn(uint256 mintAmount);
    event LockboxChanged(address newLockbox);
    event InEthChanged(address newInEth);
    event TxStorageChanged(address newTxStorage);
    event LiqPoolChanged(address newLiqPool);
    event OperatorChanged(address newOperator);

    /**
     * @notice Initializes the contract with essential addresses and parameters.
     * @param _inETHAddress The address of the inETH token.
     * @param _lockbox The address of the lockbox.
     * @param _liqPool The address of the liquidity pool.
     * @param _transactionStorage The address of the transaction storage.
     * @param _ratioFeed The address of the ratio feed contract.
     * @param _operator The address of the operator who will manage this contract.
     */
    function initialize(
        address _inETHAddress,
        address _lockbox,
        address payable _liqPool,
        address _transactionStorage,
        address _ratioFeed,
        address _operator
    ) public initializer {
        __Ownable_init(msg.sender);

        require(_inETHAddress != address(0), SettingZeroAddress());
        require(_lockbox != address(0), SettingZeroAddress());
        require(_liqPool != address(0), SettingZeroAddress());
        require(_transactionStorage != address(0), SettingZeroAddress());
        require(_ratioFeed != address(0), SettingZeroAddress());
        require(_operator != address(0), SettingZeroAddress());

        inETHAddress = _inETHAddress;
        lockboxAddress = _lockbox;
        liqPool = _liqPool;
        transactionStorage = _transactionStorage;
        ratioFeed = _ratioFeed;
        operator = _operator;
    }

    /**
     * @notice Updates the transaction storage address.
     * @param _transactionStorage The new transaction storage address.
     */
    function setTransactionStorage(
        address _transactionStorage
    ) external onlyOwner {
        require(_transactionStorage != address(0), SettingZeroAddress());
        transactionStorage = _transactionStorage;
        emit TxStorageChanged(_transactionStorage);
    }

    /**
     * @notice Updates the inETH token address.
     * @param _inETHAddress The new inETH address.
     */
    function setInETHAddress(address _inETHAddress) external onlyOwner {
        require(_inETHAddress != address(0), SettingZeroAddress());
        inETHAddress = _inETHAddress;
        emit InEthChanged(_inETHAddress);
    }

    /**
     * @notice Updates the Lockbox address.
     * @param _lockboxAddress The new Lockbox address.
     */
    function setLockboxAddress(address _lockboxAddress) external onlyOwner {
        require(_lockboxAddress != address(0), SettingZeroAddress());
        lockboxAddress = _lockboxAddress;
        emit LockboxChanged(_lockboxAddress);
    }

    /**
     * @notice Updates the liquidity pool address.
     * @param _liqPool The new liquidity pool address.
     */
    function setLiqPool(address payable _liqPool) external onlyOwner {
        require(_liqPool != address(0), SettingZeroAddress());
        liqPool = _liqPool;
        emit LiqPoolChanged(_liqPool);
    }

    /**
     * @notice Updates the operator address.
     * @param _operator The new operator address.
     */
    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), SettingZeroAddress());
        operator = _operator;
        emit OperatorChanged(_operator);
    }

    /**
     * @notice Updates the treasury data by comparing the total L2 inETH balance and adjusting the treasury accordingly.
     */
    function updateTreasuryData() public {
        uint256 totalL2InETH = 0;

        TransactionStorage storageContract = TransactionStorage(
            transactionStorage
        );
        uint32[] memory allChainIds = storageContract.getAllChainIds();

        for (uint i = 0; i < allChainIds.length; i++) {
            uint32 chainId = allChainIds[i];
            TransactionStorage.Transaction memory txData = storageContract
                .getTransactionData(chainId);
            require(
                txData.timestamp != 0,
                MissingOneOrMoreL2Transactions(chainId)
            );
            totalL2InETH += txData.inEthBalance;
        }

        uint256 lastUpdateTotalL2InEth = _lastUpdateTotalL2InEth();

        if (lastUpdateTotalL2InEth < totalL2InETH) {
            uint amountToMint = totalL2InETH - lastUpdateTotalL2InEth;
            _mintInceptionToken(amountToMint);
        } else if (lastUpdateTotalL2InEth > totalL2InETH) {
            uint amountToBurn = lastUpdateTotalL2InEth - totalL2InETH;
            _burnInceptionToken(amountToBurn);
        } else {
            revert NoRebalancingRequired();
        }

        uint256 inETHBalance = IERC20(inETHAddress).balanceOf(address(this));
        if (inETHBalance > 0) {
            require(
                IERC20(inETHAddress).transfer(lockboxAddress, inETHBalance),
                TransferToLockboxFailed()
            );
            emit InETHDepositedToLockbox(inETHBalance);
        }
    }

    function _mintInceptionToken(uint256 _amountToMint) internal {
        require(inETHAddress != address(0), InETHAddressNotSet());
        IInceptionToken cToken = IInceptionToken(inETHAddress);
        cToken.mint(lockboxAddress, _amountToMint);
        emit TreasuryUpdateMint(_amountToMint);
    }

    function _burnInceptionToken(uint256 _amountToBurn) internal {
        require(inETHAddress != address(0), InETHAddressNotSet());
        IInceptionToken cToken = IInceptionToken(inETHAddress);
        cToken.burn(lockboxAddress, _amountToBurn);
        emit TreasuryUpdateBurn(_amountToBurn);
    }

    function _lastUpdateTotalL2InEth() internal view returns (uint256) {
        return IERC20(inETHAddress).balanceOf(lockboxAddress);
    }

    /**
     * @dev Trigger by a cron job.
     * @notice Stakes a specified amount of ETH into the Liquidity Pool.
     * @param _amount The amount of ETH to stake.
     */
    function stake(uint256 _amount) external onlyOperator {
        require(liqPool != address(0), LiquidityPoolNotSet());
        require(
            _amount <= address(this).balance,
            StakeAmountExceedsEthBalance(_amount, address(this).balance)
        );
        require(
            _amount <= IRestakingPool(liqPool).availableToStake(),
            StakeAmountExceedsMaxTVL()
        );
        IRestakingPool(liqPool).stake{value: _amount}();

        uint256 inEthBalance = IERC20(inETHAddress).balanceOf(address(this));
        require(
            IERC20(inETHAddress).transfer(lockboxAddress, inEthBalance),
            TransferToLockboxFailed()
        );
        emit InETHDepositedToLockbox(inEthBalance);
    }

    /**
     * @dev msg.value is used to pay for cross-chain fees
     * @notice Sends ETH to an L2 chain through a cross-chain adapter.
     * @param _chainId The ID of the destination L2 chain.
     * @param _callValue The amount of ETH to send to L2.
     * @param _gasData Encoded gas parameters for the cross-chain transaction.
     */
    function sendEthToL2(
        uint256 _chainId,
        uint256 _callValue,
        bytes[] calldata _gasData
    ) external payable onlyOperator {
        require(
            _callValue + msg.value <= address(this).balance,
            SendAmountExceedsEthBalance(_callValue)
        );
        address payable crossChainAdapterAddress = payable(
            TransactionStorage(transactionStorage).adapters(_chainId)
        );
        require(
            crossChainAdapterAddress != address(0),
            CrosschainAdapterNotSet()
        );

        ICrossChainAdapterL1(crossChainAdapterAddress).sendEthToL2{
            value: _callValue + msg.value
        }(_callValue, _gasData);
    }

    /**
     * @notice Receives ETH sent to this contract, just in case.
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }
}

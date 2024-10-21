// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {TransactionStorage} from "./TransactionStorage.sol";
import {IRestakingPool} from "./interfaces/IRestakingPool.sol";
import {IInceptionToken} from "./interfaces/IInceptionToken.sol";
import {IInceptionRatioFeed} from "./interfaces/IInceptionRatioFeed.sol";
import {ICrossChainAdapterL1} from "./interfaces/ICrossChainAdapterL1.sol";
import {ITransactionStorage} from "./interfaces/ITransactionStorage.sol";

/**
 * @author The InceptionLRT team
 * @title Rebalancer
 * @dev This contract handles staking, manages treasury data and facilitates cross-chain ETH transfers.
 */
contract Rebalancer is Initializable, OwnableUpgradeable, ITransactionStorage {
    //------------- REBALANCER FIELDS -------------//
    address public inETHAddress;
    address public lockboxAddress;
    address payable public liqPool;
    address public ratioFeed;
    address public operator;
    uint256 public constant MULTIPLIER = 1e18;

    //------------- TX STORAGE FIELDS -------------//
    mapping(uint256 => Transaction) public txs;
    address payable public adapter;
    uint32[] public chainIds;

    modifier onlyOperator() {
        require(
            msg.sender == operator || msg.sender == owner(),
            OnlyOperator()
        );
        _;
    }

    modifier onlyAdapter() {
        require(
            msg.sender == adapter || msg.sender == owner(),
            MsgNotFromAdapter(msg.sender)
        );
        _;
    }

    error TransferToLockboxFailed();
    error InETHAddressNotSet();
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
    event LockboxChanged(address prevLockbox, address newLockbox);
    event InEthChanged(address prevInEth, address newInEth);
    event LiqPoolChanged(address prevLiqPool, address newLiqPool);
    event OperatorChanged(address prevOperator, address newOperator);

    /**
     * @notice Initializes the contract with essential addresses and parameters.
     * @param _inETHAddress The address of the inETH token.
     * @param _lockbox The address of the lockbox.
     * @param _liqPool The address of the liquidity pool.
     * @param _adapter The address of the CrossChainAdapterL1.
     * @param _ratioFeed The address of the ratio feed contract.
     * @param _operator The address of the operator who will manage this contract.
     */
    function initialize(
        address _inETHAddress,
        address _lockbox,
        address payable _liqPool,
        address payable _adapter,
        address _ratioFeed,
        address _operator
    ) public initializer {
        __Ownable_init(msg.sender);

        require(_inETHAddress != address(0), SettingZeroAddress());
        require(_lockbox != address(0), SettingZeroAddress());
        require(_liqPool != address(0), SettingZeroAddress());
        require(_adapter != address(0), SettingZeroAddress());
        require(_ratioFeed != address(0), SettingZeroAddress());
        require(_operator != address(0), SettingZeroAddress());

        inETHAddress = _inETHAddress;
        lockboxAddress = _lockbox;
        liqPool = _liqPool;
        adapter = _adapter;
        ratioFeed = _ratioFeed;
        operator = _operator;
    }

    /**
     * @notice Updates the inETH token address.
     * @param _inETHAddress The new inETH address.
     */
    function setInETHAddress(address _inETHAddress) external onlyOwner {
        require(_inETHAddress != address(0), SettingZeroAddress());
        emit InEthChanged(inETHAddress, _inETHAddress);
        inETHAddress = _inETHAddress;
    }

    /**
     * @notice Updates the Lockbox address.
     * @param _lockboxAddress The new Lockbox address.
     */
    function setLockboxAddress(address _lockboxAddress) external onlyOwner {
        require(_lockboxAddress != address(0), SettingZeroAddress());
        emit LockboxChanged(lockboxAddress, _lockboxAddress);
        lockboxAddress = _lockboxAddress;
    }

    /**
     * @notice Updates the liquidity pool address.
     * @param _liqPool The new liquidity pool address.
     */
    function setLiqPool(address payable _liqPool) external onlyOwner {
        require(_liqPool != address(0), SettingZeroAddress());
        liqPool = _liqPool;
        emit LiqPoolChanged(liqPool, _liqPool);
    }

    /**
     * @notice Updates the operator address.
     * @param _operator The new operator address.
     */
    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), SettingZeroAddress());
        emit OperatorChanged(operator, _operator);
        operator = _operator;
    }

    /**
     * @notice Updates the treasury data by comparing the total L2 inETH balance and adjusting the treasury accordingly.
     */
    function updateTreasuryData() public {
        uint256 totalL2InETH = 0;

        uint32[] memory allChainIds = getAllChainIds();

        for (uint i = 0; i < allChainIds.length; i++) {
            uint32 chainId = allChainIds[i];
            Transaction memory txData = getTransactionData(chainId);
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
     * @dev Triggered by a cron job.
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
     * @dev msg.value is used to pay for cross-chain fees (calculated externally)
     * @notice Sends ETH to an L2 chain through a cross-chain adapter.
     * @param _chainId The ID of the destination L2 chain.
     * @param _callValue The amount of ETH to send to L2.
     */
    function sendEthToL2(
        uint256 _chainId,
        uint256 _callValue
    ) external payable onlyOperator {
        require(adapter != address(0), CrosschainAdapterNotSet());
        require(
            _callValue + msg.value <= address(this).balance,
            SendAmountExceedsEthBalance(_callValue)
        );

        ICrossChainAdapterL1(adapter).sendEthToL2{
            value: _callValue + msg.value
        }(_chainId);
    }

    function quoteSendEthToL2(
        uint256 _chainId
    ) external view returns (uint256) {
        require(adapter != address(0), CrosschainAdapterNotSet());
        return ICrossChainAdapterL1(adapter).quoteSendEth(_chainId);
    }

    //------------------------ TX STORAGE FUNCTIONS ------------------------//

    /**
     * @notice Adds a new Chain ID to the storage.
     * @dev Ensures that the Chain ID does not already exist in the list.
     * @param _newChainId The Chain ID to add.
     */
    function addChainId(uint32 _newChainId) external onlyOwner {
        for (uint i = 0; i < chainIds.length; i++) {
            if (chainIds[i] == _newChainId) {
                revert ChainIdAlreadyExists(chainIds[i]);
            }
        }
        chainIds.push(_newChainId);
    }

    /**
     * @notice Handles Layer 2 information and updates the transaction data for a specific Chain ID.
     * @dev Verifies that the caller is the correct adapter and that the timestamp is valid.
     * @param _chainId The Chain ID of the transaction.
     * @param _timestamp The timestamp when the transaction occurred.
     * @param _balance The ETH balance involved in the transaction.
     * @param _totalSupply The total inETH supply for the transaction.
     */
    function handleL2Info(
        uint256 _chainId,
        uint256 _timestamp,
        uint256 _balance,
        uint256 _totalSupply
    ) external onlyAdapter {
        require(
            _timestamp <= block.timestamp,
            TimeCannotBeInFuture(_timestamp)
        );

        Transaction memory lastUpdate = txs[_chainId];

        if (lastUpdate.timestamp != 0) {
            require(
                _timestamp > lastUpdate.timestamp,
                TimeBeforePrevRecord(_timestamp)
            );
        }

        Transaction memory newUpdate = Transaction({
            timestamp: _timestamp,
            ethBalance: _balance,
            inEthBalance: _totalSupply
        });

        txs[_chainId] = newUpdate;

        emit L2InfoReceived(_chainId, _timestamp, _balance, _totalSupply);
    }

    /**
     * @notice Retrieves the transaction for a specific Chain ID. NB! Only one (last) transaction is stored.
     * @param _chainId The Chain ID for which to retrieve the last transaction data.
     * @return The transaction data (timestamp, ETH balance, inETH balance).
     */
    function getTransactionData(
        uint256 _chainId
    ) public view returns (Transaction memory) {
        return txs[_chainId];
    }

    /**
     * @notice Returns all stored Chain IDs (and henceforth - all supported networks).
     * @return An array containing all Chain IDs stored in the contract.
     */
    function getAllChainIds() public view returns (uint32[] memory) {
        return chainIds;
    }

    /**
     * @dev Replaces the crosschain adapters
     * @param _newAdapter The address of the adapter.
     */
    function setAdapter(address payable _newAdapter) external onlyOwner {
        require(_newAdapter != address(0), SettingZeroAddress());

        emit AdapterChanged(adapter, _newAdapter);
        adapter = _newAdapter;
    }

    /**
     * @notice Receives ETH sent to this contract, just in case.
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }
}

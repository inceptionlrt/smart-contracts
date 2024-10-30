// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IRestakingPool} from "./interfaces/IRestakingPool.sol";
import {IInceptionToken} from "./interfaces/IInceptionToken.sol";
import {IInceptionRatioFeed} from "./interfaces/IInceptionRatioFeed.sol";
import {ICrossChainBridgeL1} from "./interfaces/ICrossChainBridgeL1.sol";
import {INativeRebalancer} from "./interfaces/INativeRebalancer.sol";

/**
 * @author The InceptionLRT team
 * @title NativeRebalancer
 * @dev This contract handles staking, manages treasury data and facilitates cross-chain ETH transfers.
 */
contract NativeRebalancer is
    Initializable,
    OwnableUpgradeable,
    INativeRebalancer
{
    //------------- REBALANCER FIELDS -------------//
    address public inceptionToken;
    address public lockboxAddress;
    address payable public liqPool;
    address public ratioFeed;
    address public operator;
    uint256 public constant MULTIPLIER = 1e18;

    //------------- TX STORAGE FIELDS -------------//
    mapping(uint256 => Transaction) public txs;
    mapping(uint256 => address payable) adapters;
    address payable public defaultAdapter;
    uint32[] public chainIds;

    modifier onlyOperator() {
        require(
            msg.sender == operator || msg.sender == owner(),
            OnlyOperator()
        );
        _;
    }

    modifier onlyAdapter(uint256 _chainId) {
        require(msg.sender == _getAdapter(_chainId), OnlyAdapter());
        _;
    }

    /**
     * @notice Initializes the contract with essential addresses and parameters.
     * @param _inceptionToken The address of the InceptionToken token.
     * @param _lockbox The address of the lockbox.
     * @param _liqPool The address of the liquidity pool.
     * @param _defaultAdapter The address of the CrossChainBridgeL1.
     * @param _ratioFeed The address of the ratio feed contract.
     * @param _operator The address of the operator who will manage this contract.
     */
    function initialize(
        address _inceptionToken,
        address _lockbox,
        address payable _liqPool,
        address payable _defaultAdapter,
        address _ratioFeed,
        address _operator
    ) public initializer {
        __Ownable_init(msg.sender);

        require(_inceptionToken != address(0), SettingZeroAddress());
        require(_lockbox != address(0), SettingZeroAddress());
        require(_liqPool != address(0), SettingZeroAddress());
        require(_defaultAdapter != address(0), SettingZeroAddress());
        require(_ratioFeed != address(0), SettingZeroAddress());
        require(_operator != address(0), SettingZeroAddress());

        inceptionToken = _inceptionToken;
        lockboxAddress = _lockbox;
        liqPool = _liqPool;
        defaultAdapter = _defaultAdapter;
        ratioFeed = _ratioFeed;
        operator = _operator;
    }

    /**
     * @notice Updates the InceptionToken address.
     * @param _inceptionToken The new InceptionToken address.
     */
    function setInceptionToken(address _inceptionToken) external onlyOwner {
        require(_inceptionToken != address(0), SettingZeroAddress());
        emit InceptionTokenChanged(inceptionToken, _inceptionToken);
        inceptionToken = _inceptionToken;
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
        emit LiqPoolChanged(liqPool, _liqPool);
        liqPool = _liqPool;
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

        uint32[] memory allChainIds = chainIds;

        for (uint i = 0; i < allChainIds.length; i++) {
            uint32 chainId = allChainIds[i];
            Transaction memory txData = getTransactionData(chainId);
            require(
                txData.timestamp != 0,
                MissingOneOrMoreL2Transactions(chainId)
            );
            totalL2InETH += txData.inceptionTokenBalance;
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

        uint256 inETHBalance = IERC20(inceptionToken).balanceOf(address(this));
        if (inETHBalance > 0) {
            require(
                IERC20(inceptionToken).transfer(lockboxAddress, inETHBalance),
                TransferToLockboxFailed()
            );
            emit InceptionTokenDepositedToLockbox(inETHBalance);
        }
    }

    function _mintInceptionToken(uint256 _amountToMint) internal {
        require(inceptionToken != address(0), InceptionTokenAddressNotSet());
        IInceptionToken cToken = IInceptionToken(inceptionToken);
        cToken.mint(lockboxAddress, _amountToMint);
        emit TreasuryUpdateMint(_amountToMint);
    }

    function _burnInceptionToken(uint256 _amountToBurn) internal {
        require(inceptionToken != address(0), InceptionTokenAddressNotSet());
        IInceptionToken cToken = IInceptionToken(inceptionToken);
        cToken.burn(lockboxAddress, _amountToBurn);
        emit TreasuryUpdateBurn(_amountToBurn);
    }

    function _lastUpdateTotalL2InEth() internal view returns (uint256) {
        return IERC20(inceptionToken).balanceOf(lockboxAddress);
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

        uint256 inceptionTokenBalance = IERC20(inceptionToken).balanceOf(
            address(this)
        );
        require(
            IERC20(inceptionToken).transfer(
                lockboxAddress,
                inceptionTokenBalance
            ),
            TransferToLockboxFailed()
        );
        emit InceptionTokenDepositedToLockbox(inceptionTokenBalance);
    }

    /**
     * @dev msg.value is used to pay for cross-chain fees (calculated externally)
     * @notice Sends ETH to an L2 chain through a cross-chain defaultAdapter.
     * @param _chainId The ID of the destination L2 chain.
     * @param _callValue The amount of ETH to send to L2.
     */
    function sendEthToL2(
        uint256 _chainId,
        uint256 _callValue,
        bytes memory _options
    ) external payable onlyOperator {
        address payable adapter = payable(_getAdapter(_chainId));
        require(adapter != address(0), CrosschainBridgeNotSet());
        require(
            _callValue + msg.value <= address(this).balance,
            SendAmountExceedsEthBalance(_callValue)
        );

        ICrossChainBridgeL1(adapter).sendEthCrossChain{
            value: _callValue + msg.value
        }(_chainId, _options);
    }

    /**
     * @notice Calculates fees to send ETH to other chain. The `SEND_VALUE` encoded in options is not included in the return
     * @param _chainId chain ID of the network to simulate sending ETH to
     * @param _options encoded params for cross-chain message. Includes `SEND_VALUE` which is substracted from the end result
     * @return fee required to pay for cross-chain transaction, without the value to be sent itself
     */
    function quoteSendEthToL2(
        uint256 _chainId,
        bytes calldata _options
    ) external view returns (uint256 fee) {
        address payable adapter = payable(_getAdapter(_chainId));
        require(adapter != address(0), CrosschainBridgeNotSet());

        uint256 valueStart = _options.length - 16;
        uint256 valueEnd = _options.length;
        uint256 sendValue = uint256(
            uint128(bytes16(_options[valueStart:valueEnd]))
        );
        fee =
            ICrossChainBridgeL1(adapter).quoteSendEth(_chainId, _options) -
            sendValue;
    }

    /**
     * @notice Handles Layer 2 information and updates the transaction data for a specific Chain ID.
     * @dev Verifies that the caller is the correct defaultAdapter and that the timestamp is valid.
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
    ) external onlyAdapter(_chainId) {
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
            inceptionTokenBalance: _totalSupply
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
     * @dev Replaces the crosschain bridges
     * @param _newAdapter The address of the defaultAdapter.
     */
    function addAdapter(
        uint32 _chainId,
        address payable _newAdapter
    ) external onlyOwner {
        require(_newAdapter != address(0), SettingZeroAddress());
        adapters[_chainId] = _newAdapter;
        _addChainId(_chainId);

        emit AdapterAdded(_chainId, _newAdapter);
    }

    /**
     * @notice set the so-called defaultAdapter - the adapter to be used for every chain unless a
      specific adapter for specific chainId is set
     * @param _newDefaultAdapter Address of the default cross-chain adapter
     **/
    function setDefaultAdapter(
        address payable _newDefaultAdapter
    ) external override onlyOwner {
        require(_newDefaultAdapter != address(0), SettingZeroAddress());

        emit DefaultBridgeChanged(defaultAdapter, _newDefaultAdapter);
        defaultAdapter = _newDefaultAdapter;
    }

    function addChainId(uint32 _newChainId) external onlyOperator {
        _addChainId(_newChainId);
    }

    /**
     * @notice Removes a specific `chainId` from the `chainIds` array.
     * @param _chainId The Chain ID to delete.
     */
    function deleteChainId(uint32 _chainId) public onlyOperator {
        uint256 index;
        bool found = false;

        // Find the _chainId in the array
        for (uint256 i = 0; i < chainIds.length; i++) {
            if (chainIds[i] == _chainId) {
                index = i;
                found = true;
                break;
            }
        }

        require(found, ChainIdNotFound(_chainId));

        // Move the last element into the place of the one to delete
        chainIds[index] = chainIds[chainIds.length - 1];
        chainIds.pop();
        emit ChainIdDeleted(_chainId, index);
    }

    /**
     * @notice Fetches the adapter assigned to a specific chain ID
     * @param _chainId The Chain ID
     * @return adapter address of the adapter for the specified chainId. Returns 0 if non set
     * @return isDefault whether the returned adapter is default or not (from the mapping)
     */
    function getAdapter(
        uint256 _chainId
    ) external view returns (address payable adapter, bool isDefault) {
        adapter = _getAdapter(_chainId);
        if (adapter == defaultAdapter) {
            isDefault = true;
        }
    }

    function _getAdapter(
        uint256 _chainId
    ) internal view returns (address payable adapter) {
        adapter = adapters[_chainId];
        if (adapter == address(0)) {
            adapter = defaultAdapter;
        }

        require(adapter != address(0), NoAdapterAvailable(_chainId));
    }

    /**
     * @notice Adds a new Chain ID to the storage.
     * @dev Ensures that the Chain ID does not already exist in the list.
     * @param _newChainId The Chain ID to add.
     */
    function _addChainId(uint32 _newChainId) internal {
        for (uint i = 0; i < chainIds.length; i++) {
            if (chainIds[i] == _newChainId) {
                return;
            }
        }
        chainIds.push(_newChainId);
        emit ChainIdAdded(_newChainId);
    }

    /**
     * @notice Receives ETH sent to this contract, just in case.
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }
}

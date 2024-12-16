// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20RebalancerStorage} from "./ERC20RebalancerStorage.sol";

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @author The InceptionLRT team
 * @title ERC20Rebalancer
 * @dev This contract handles staking, manages treasury data and facilitates cross-chain ERC20 transfers.
 */
contract ERC20Rebalancer is ERC20RebalancerStorage {
    using SafeERC20 for IERC20;

    uint256 public assetInfoTxMaxDelay;

    /**
     * @notice Initializes the contract with essential addresses and parameters.
     * @param _inceptionToken The address of the InceptionToken token.
     * @param _lockbox The address of the lockbox.
     * @param _inceptionVault The address of the inception vault.
     * @param _defaultAdapter The address of the CrossChainBridgeL1.
     * @param _ratioFeed The address of the ratio feed contract.
     * @param _operator The address of the operator who will manage this contract.
     */
    function initialize(
        address _inceptionToken,
        address _lockbox,
        address _inceptionVault,
        address payable _defaultAdapter,
        address _ratioFeed,
        address _operator
    ) public initializer {
        __Ownable_init(msg.sender);

        __RebalancerStorage_init(
            _inceptionToken,
            _lockbox,
            _inceptionVault,
            _defaultAdapter,
            _ratioFeed,
            _operator
        );
    }

    /**
     * @notice Updates the treasury data by comparing the total L2 inETH balance and adjusting the treasury accordingly.
     */
    function updateTreasuryData() public {
        uint256 totalL2UnderlyingBalance = 0;

        uint256[] memory allChainIds = chainIds;
        require(chainIds.length > 0, NoChainIdsConfigured());

        for (uint i = 0; i < allChainIds.length; i++) {
            uint256 chainId = allChainIds[i];
            Transaction memory txData = getTransactionData(chainId);
            require(
                txData.timestamp != 0,
                MissingOneOrMoreL2Transactions(chainId)
            );
            require(
                block.timestamp - txData.timestamp <= assetInfoTxMaxDelay,
                MissingOneOrMoreL2Transactions(chainId)
            );
            totalL2UnderlyingBalance += txData.underlyingBalance;
        }

        uint256 lastUpdateTotalL2InEth = _lastUpdateTotalL2InEth();
        if (lastUpdateTotalL2InEth < totalL2UnderlyingBalance) {
            uint256 amountToMint = totalL2UnderlyingBalance;
            _mintInceptionToken(amountToMint);

            // emit SyncedSupplyChanged(
            //     lastUpdateTotalL2InEth,
            //     lastUpdateTotalL2InEth + amountToMint
            // );
        } else if (lastUpdateTotalL2InEth > totalL2UnderlyingBalance) {
            uint256 amountToBurn = lastUpdateTotalL2InEth -
                totalL2UnderlyingBalance;
            _burnInceptionToken(amountToBurn);

            // emit SyncedSupplyChanged(lastUpdateTotalL2InEth, amountToBurn);
        } else {
            revert NoRebalancingRequired();
        }

        uint256 bal = IERC20(address(inceptionToken)).balanceOf(address(this));
        if (bal == 0) return;

        require(
            IERC20(address(inceptionToken)).transfer(lockBox, bal),
            TransferToLockboxFailed()
        );

        // TODO
        //emit InceptionTokenDepositedToLockbox(balance);
    }

    function _lastUpdateTotalL2InEth() internal view returns (uint256) {
        return IERC20(address(inceptionToken)).balanceOf(lockBox);
    }

    /**
     * @dev Triggered by a cron job.
     * @notice Stakes a specified amount of ETH into the Liquidity Pool.
     * @param _amount The amount of ETH to stake.
     */
    function stake(uint256 _amount) external onlyOperator {
        // TODO
        require(address(inceptionVault) != address(0), LiquidityPoolNotSet());
        require(
            _amount <= IERC20(address(inceptionToken)).balanceOf(address(this)),
            StakeAmountExceedsEthBalance(
                _amount,
                IERC20(address(inceptionToken)).balanceOf(address(this))
            )
        );

        IERC20(address(inceptionToken)).safeTransfer(
            address(inceptionVault),
            _amount
        );

        // TODO
        emit TransferToRestakingPool(_amount);
    }

    /**
     * @notice Calculates fees to send ETH to other chain. The `SEND_VALUE` encoded in options is not included in the return
     * @param _chainId chain ID of the network to simulate sending ETH to
     * @param _options encoded params for cross-chain message. Includes `SEND_VALUE` which is substracted from the end result
     * @return fee required to pay for cross-chain transaction, without the value to be sent itself
     */
    function quoteSendEthToL2(uint256 _chainId, bytes calldata _options)
        external
        view
        returns (uint256 fee)
    {
        // address payable adapter = payable(_getAdapter(_chainId));
        // require(adapter != address(0), CrosschainBridgeNotSet());
        // return
        //     ICrossChainBridgeL1(adapter).quoteSendEth(_chainId, _options) -
        //     ICrossChainBridgeL1(adapter).getValueFromOpts(_options);
        return 0;
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

        if (lastUpdate.timestamp != 0)
            require(
                _timestamp > lastUpdate.timestamp,
                TimeBeforePrevRecord(_timestamp)
            );

        Transaction memory newUpdate = Transaction({
            timestamp: _timestamp,
            underlyingBalance: _balance,
            inceptionTokenSupply: _totalSupply
        });

        txs[_chainId] = newUpdate;

        emit L2InfoReceived(_chainId, _timestamp, _balance, _totalSupply);
    }

    function _mintInceptionToken(uint256 _amountToMint) internal {
        require(
            address(inceptionToken) != address(0),
            InceptionTokenAddressNotSet()
        );
        inceptionToken.mint(lockBox, _amountToMint);
        emit TreasuryUpdateMint(_amountToMint);
    }

    function _burnInceptionToken(uint256 _amountToBurn) internal {
        require(
            address(inceptionToken) != address(0),
            InceptionTokenAddressNotSet()
        );
        inceptionToken.burn(lockBox, _amountToBurn);
        emit TreasuryUpdateBurn(_amountToBurn);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {ERC20RebalancerStorage} from "./ERC20RebalancerStorage.sol";

/**
 * @title ERC20Rebalancer
 * @author The InceptionLRT team
 * @dev This contract handles staking(transfer to a specific vault),
 *      manages treasury data and facilitates cross-chain ERC20 transfers.
 */
contract ERC20Rebalancer is ERC20RebalancerStorage {
    using SafeERC20 for IERC20;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with essential addresses and parameters.
     * @param _inceptionToken The address of the InceptionToken token.
     * @param _lockbox The address of the lockbox.
     * @param _inceptionVault The address of the inception vault.
     * @param _defaultAdapter The address of the CrossChainBridgeL1.
     * @param _operator The address of the operator who will manage this contract.
     */
    function initialize(
        uint256 defaultChainId,
        address _inceptionToken,
        address _underlyingAsset,
        address _lockbox,
        address _inceptionVault,
        address payable _defaultAdapter,
        address _operator
    ) public initializer {
        __Ownable_init();

        __RebalancerStorage_init(
            defaultChainId,
            _inceptionToken,
            _underlyingAsset,
            _lockbox,
            _inceptionVault,
            _defaultAdapter,
            _operator
        );
    }

    /**
     * @notice Updates the treasury data by comparing the total L2 inETH balance and adjusting the treasury accordingly.
     */
    function updateTreasuryData() public {
        Transaction memory txData = getTransactionData();
        require(
            txData.timestamp != 0,
            MissingOneOrMoreL2Transactions(defaultChainId)
        );
        require(
            block.timestamp - txData.timestamp <= assetInfoTxMaxDelay,
            OutdatedAssetInfo(defaultChainId)
        );

        uint256 totalL2Supply = txData.inceptionTokenSupply;

        uint256 lockBoxSupply = _lockboxSupply();
        if (totalL2Supply > lockBoxSupply) {
            uint256 amountToMint = totalL2Supply - lockBoxSupply;
            _mintInceptionToken(amountToMint);

            emit SyncedSupplyChanged(
                lockBoxSupply,
                lockBoxSupply + amountToMint
            );
        } else if (lockBoxSupply > totalL2Supply) {
            uint256 amountToBurn = lockBoxSupply - totalL2Supply;
            _burnInceptionToken(amountToBurn);

            emit SyncedSupplyChanged(
                lockBoxSupply,
                lockBoxSupply - amountToBurn
            );
        } else {
            revert NoRebalancingRequired();
        }

        uint256 bal = IERC20(address(underlyingAsset)).balanceOf(address(this));
        if (bal == 0) return;

        IERC20(address(underlyingAsset)).safeTransfer(
            address(inceptionVault),
            bal
        );

        emit TransferToInceptionVault(bal);
    }

    /**
     * @dev Triggered by a cron job.
     * @notice Stakes a specified amount of underlyingAsset into the InceptionVault.
     * @param _amount The amount of underlyingAsset to stake.
     */
    function stake(uint256 _amount) external onlyOperator {
        require(address(inceptionVault) != address(0), InceptionVaultNotSet());
        require(
            _amount <=
                IERC20(address(underlyingAsset)).balanceOf(address(this)),
            StakeAmountExceedsBalance(
                _amount,
                IERC20(address(underlyingAsset)).balanceOf(address(this))
            )
        );

        IERC20(address(underlyingAsset)).safeTransfer(
            address(inceptionVault),
            _amount
        );

        emit TransferToInceptionVault(_amount);
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
    ) external onlyAdapter {
        require(
            _timestamp <= block.timestamp,
            TimeCannotBeInFuture(_timestamp)
        );
        require(_chainId == defaultChainId, ChainIdNotFound(_chainId));

        Transaction memory lastUpdate = lastTx;
        if (lastUpdate.timestamp != 0)
            require(
                _timestamp > lastUpdate.timestamp,
                TimeBeforePrevRecord(_timestamp)
            );

        lastTx = Transaction({
            timestamp: _timestamp,
            underlyingBalance: _balance,
            inceptionTokenSupply: _totalSupply
        });

        emit L2InfoReceived(_chainId, _timestamp, _balance, _totalSupply);
    }

    function _mintInceptionToken(uint256 _amountToMint) private {
        require(
            address(inceptionToken) != address(0),
            InceptionTokenAddressNotSet()
        );
        inceptionToken.mint(lockBox, _amountToMint);
        emit TreasuryUpdateMint(_amountToMint);
    }

    function _burnInceptionToken(uint256 _amountToBurn) private {
        require(
            address(inceptionToken) != address(0),
            InceptionTokenAddressNotSet()
        );
        inceptionToken.burn(lockBox, _amountToBurn);
        emit TreasuryUpdateBurn(_amountToBurn);
    }
}

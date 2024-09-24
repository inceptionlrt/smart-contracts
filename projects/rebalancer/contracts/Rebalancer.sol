// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./TransactionStorage.sol";
import "./interfaces/IRestakingPool.sol";
import "./interfaces/IInceptionToken.sol";
import "./interfaces/IInceptionRatioFeed.sol";
import "./interfaces/ICrossChainAdapterL1.sol";

contract Rebalancer is Initializable, OwnableUpgradeable {
    address public inETHAddress;
    address public lockboxAddress;
    address payable public liqPool;
    address public transactionStorage;
    address public ratioFeed;
    address public crosschainAdapter;

    uint256 public constant MULTIPLIER = 1e18;
    uint256 public constant MAX_DIFF = 50000000000000000; // 0.05 * 1e18
    uint256 public totalAmountToWithdraw; // Initialized in initialize

    error RatioDifferenceTooHigh();
    error TransferToLockboxFailed();
    error InETHAddressNotSet();
    error SettingZeroAddress();
    error LiquidityPoolNotSet();
    error CrosschainAdapterNotSet();
    error MissingOneOrMoreL2Transactions(uint256 chainId);
    error StakeAmountExceedsInEthBalance(
        uint256 staked,
        uint256 availableTokens
    );
    error SendAmountExceedsEthBalance(uint256 amountToSend);
    error StakeAmountExceedsMaxTVL();

    event ETHReceived(address sender, uint256 amount);
    event InETHDepositedToLockbox(uint256 mintAmount);
    event TreasuryUpdateMint(uint256 mintAmount);
    event TreasuryUpdateBurn(uint256 mintAmount);
    event LockboxChanged(address newLockbox);
    event InEthChanged(address newInEth);
    event TxStorageChanged(address newTxStorage);
    event LiqPoolChanged(address newLiqPool);
    event CrosschainAdapterChanged(address newCrosschainAdapter);

    function initialize(
        address _inETHAddress,
        address _lockbox,
        address payable _liqPool,
        address _transactionStorage,
        address _ratioFeed
    ) public initializer {
        __Ownable_init(msg.sender);

        require(_inETHAddress != address(0), SettingZeroAddress());
        require(_lockbox != address(0), SettingZeroAddress());
        require(_liqPool != address(0), SettingZeroAddress());
        require(_transactionStorage != address(0), SettingZeroAddress());
        require(_ratioFeed != address(0), SettingZeroAddress());

        inETHAddress = _inETHAddress;
        lockboxAddress = _lockbox;
        liqPool = _liqPool;
        transactionStorage = _transactionStorage;
        ratioFeed = _ratioFeed;
    }

    function setTransactionStorage(
        address _transactionStorage
    ) external onlyOwner {
        require(_transactionStorage != address(0), SettingZeroAddress());
        transactionStorage = _transactionStorage;
        emit TxStorageChanged(_transactionStorage);
    }

    function setInETHAddress(address _inETHAddress) external onlyOwner {
        require(_inETHAddress != address(0), SettingZeroAddress());
        inETHAddress = _inETHAddress;
        emit InEthChanged(_inETHAddress);
    }

    function setLockboxAddress(address _lockboxAddress) external onlyOwner {
        require(_lockboxAddress != address(0), SettingZeroAddress());
        lockboxAddress = _lockboxAddress;
        emit LockboxChanged(_lockboxAddress);
    }

    function setLiqPool(address payable _liqPool) external onlyOwner {
        require(_liqPool != address(0), SettingZeroAddress());
        liqPool = _liqPool;
        emit LiqPoolChanged(_liqPool);
    }

    function setCrosschainAdapter(
        address _crosschainAdapter
    ) external onlyOwner {
        require(_crosschainAdapter != address(0), SettingZeroAddress());
        crosschainAdapter = _crosschainAdapter;
        emit CrosschainAdapterChanged(_crosschainAdapter);
    }

    function updateTreasuryData() public {
        uint256 totalL2InETH = 0;
        // uint256 total2ETH = 0; //TODO: to be used in later features

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
            // total2ETH += txData.ethBalance; //TODO: to be used in later features
        }

        // //TODO: to be used in later features
        // uint256 l1Ratio = getRatioL1();
        // uint256 l2Ratio = getRatioL2(totalL2InETH, total2ETH);
        // int256 ratioDiff = int256(l2Ratio) - int256(l1Ratio);

        // require(
        //     !isAGreaterThanB(ratioDiff, int256(MAX_DIFF)),
        //     RatioDifferenceTooHigh()
        // );

        uint256 lastUpdateTotalL2InEth = _lastUpdateTotalL2InEth();

        if (lastUpdateTotalL2InEth < totalL2InETH) {
            uint amountToMint = totalL2InETH - lastUpdateTotalL2InEth;
            emit TreasuryUpdateMint(amountToMint);
            mintInceptionToken(amountToMint);
        } else if (lastUpdateTotalL2InEth > totalL2InETH) {
            uint amountToBurn = lastUpdateTotalL2InEth - totalL2InETH;
            burnInceptionToken(amountToBurn);
            emit TreasuryUpdateBurn(amountToBurn);
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

    function mintInceptionToken(uint256 _amountToMint) internal {
        require(inETHAddress != address(0), InETHAddressNotSet());
        IInceptionToken cToken = IInceptionToken(inETHAddress);
        cToken.mint(lockboxAddress, _amountToMint);
    }

    function burnInceptionToken(uint256 _amountToBurn) internal {
        require(inETHAddress != address(0), InETHAddressNotSet());
        IInceptionToken cToken = IInceptionToken(inETHAddress);
        cToken.burn(lockboxAddress, _amountToBurn);
    }

    function getRatioL1() internal view returns (uint256) {
        return
            IInceptionRatioFeed(ratioFeed).getRatioFor(address(inETHAddress));
    }

    function getRatioL2(
        uint256 _tokenAmount,
        uint256 _ethAmount
    ) public pure returns (uint256) {
        return (_tokenAmount * MULTIPLIER) / _ethAmount;
    }

    function _lastUpdateTotalL2InEth() internal view returns (uint256) {
        return IERC20(inETHAddress).balanceOf(lockboxAddress);
    }

    function abs(int256 x) internal pure returns (uint256) {
        return x < 0 ? uint256(-x) : uint256(x);
    }

    function isAGreaterThanB(int256 a, int256 b) internal pure returns (bool) {
        uint256 absA = abs(a);
        uint256 absB = abs(b);
        return absA > absB;
    }

    function stake(uint256 _amount) external payable onlyOwner {
        require(liqPool != address(0), LiquidityPoolNotSet());
        require(
            _amount <= localInEthBalance(),
            StakeAmountExceedsInEthBalance(_amount, localInEthBalance())
        );
        require(
            _amount <= IRestakingPool(liqPool).availableToStake(),
            StakeAmountExceedsMaxTVL()
        );
        IRestakingPool(liqPool).stake{value: msg.value}();

        require(
            IERC20(inETHAddress).transfer(lockboxAddress, _amount),
            TransferToLockboxFailed()
        );
        emit InETHDepositedToLockbox(_amount);
    }

    function sendEthToL2(uint256 _amount) external onlyOwner {
        require(crosschainAdapter != address(0), CrosschainAdapterNotSet());
        require(
            _amount <= address(this).balance,
            SendAmountExceedsEthBalance(_amount)
        );
        ICrossChainAdapterL1(crosschainAdapter).sendEthToL2{value: _amount}();
    }

    function localInEthBalance() public view returns (uint256) {
        return IERC20(inETHAddress).balanceOf(address(this));
    }

    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }
}

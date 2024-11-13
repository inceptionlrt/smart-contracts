// SPDX-License-Identifier: BSL-1.1
pragma solidity 0.8.25;

import "./interfaces/IVault.sol";

import "./DefaultAccessControl.sol";

import "./FullMath.sol";

import "./VaultConfigurator.sol";

contract MockMellowVault is IVault, ERC20, DefaultAccessControl, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    /// @inheritdoc IVault
    uint256 public constant Q96 = 2 ** 96;
    /// @inheritdoc IVault
    uint256 public constant D9 = 1e9;

    /// @inheritdoc IVault
    IVaultConfigurator public configurator;

    mapping(address => WithdrawalRequest) private _withdrawalRequest;
    EnumerableSet.AddressSet private _pendingWithdrawers;
    address[] private _underlyingTokens;
    mapping(address => bool) private _isUnderlyingToken;
    EnumerableSet.AddressSet private _tvlModules;

    modifier checkDeadline(uint256 deadline) {
        if (deadline < block.timestamp) revert Deadline();
        _;
    }

    /// @inheritdoc IVault
    function withdrawalRequest(
        address user
    ) external view returns (WithdrawalRequest memory) {
        return _withdrawalRequest[user];
    }

    /// @inheritdoc IVault
    function pendingWithdrawersCount() external view returns (uint256) {
        return _pendingWithdrawers.length();
    }

    /// @inheritdoc IVault
    function pendingWithdrawers(
        uint256 limit,
        uint256 offset
    ) external view returns (address[] memory result) {
        EnumerableSet.AddressSet storage withdrawers_ = _pendingWithdrawers;
        uint256 count = withdrawers_.length();
        if (offset >= count || limit == 0) return result;
        count -= offset;
        if (count > limit) count = limit;
        result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = withdrawers_.at(offset + i);
        }
        return result;
    }

    /// @inheritdoc IVault
    function pendingWithdrawers() external view returns (address[] memory) {
        return _pendingWithdrawers.values();
    }

    /// @inheritdoc IVault
    function underlyingTokens() external view returns (address[] memory) {
        return _underlyingTokens;
    }

    /// @inheritdoc IVault
    function isUnderlyingToken(
        address token
    ) external view returns (bool isUnderlying) {
        return _isUnderlyingToken[token];
    }

    /// @inheritdoc IVault
    function tvlModules() external view returns (address[] memory) {
        return _tvlModules.values();
    }

    function _calculateTvl(
        address[] memory tokens,
        bool isUnderlying
    ) private view returns (uint256[] memory amounts) {
        amounts = new uint256[](tokens.length);
        uint256[] memory negativeAmounts = new uint256[](tokens.length);
        ITvlModule.Data[] memory tvl_ = _tvls();
        ITvlModule.Data memory data;
        for (uint256 i = 0; i < tvl_.length; i++) {
            data = tvl_[i];
            (uint256 amount, address token) = isUnderlying
                ? (data.underlyingAmount, data.underlyingToken)
                : (data.amount, data.token);
            for (uint256 j = 0; j < tokens.length; j++) {
                if (token != tokens[j]) continue;
                (data.isDebt ? negativeAmounts : amounts)[j] += amount;
                break;
            }
        }
        for (uint256 i = 0; i < tokens.length; i++) {
            if (amounts[i] < negativeAmounts[i]) revert InvalidState();
            amounts[i] -= negativeAmounts[i];
        }
    }

    /// @inheritdoc IVault
    function underlyingTvl()
        public
        view
        returns (address[] memory tokens, uint256[] memory amounts)
    {
        tokens = _underlyingTokens;
        amounts = _calculateTvl(tokens, true);
    }

    /// @inheritdoc IVault
    function baseTvl()
        public
        view
        returns (address[] memory tokens, uint256[] memory amounts)
    {
        ITvlModule.Data[] memory data = _tvls();
        tokens = new address[](data.length);
        uint256 length = 0;
        for (uint256 i = 0; i < data.length; i++) {
            if (data[i].token == address(0)) continue;
            uint256 tokenIndex = length;
            for (uint256 j = 0; j < length; j++) {
                if (tokens[j] != data[i].token) continue;
                tokenIndex = j;
                break;
            }
            if (tokenIndex != length) continue;
            tokens[tokenIndex] = data[i].token;
            length++;
        }
        for (uint256 i = 0; i < length; i++) {
            for (uint256 j = i + 1; j < length; j++) {
                if (tokens[i] < tokens[j]) continue;
                (tokens[i], tokens[j]) = (tokens[j], tokens[i]);
            }
        }
        assembly {
            mstore(tokens, length)
        }
        amounts = _calculateTvl(tokens, false);
    }

    function _tvls() private view returns (ITvlModule.Data[] memory data) {
        ITvlModule.Data[][] memory responses = new ITvlModule.Data[][](
            _tvlModules.length()
        );
        uint256 length = 0;
        for (uint256 i = 0; i < responses.length; i++) {
            address module = _tvlModules.at(i);
            responses[i] = ITvlModule(module).tvl(address(this));
            length += responses[i].length;
        }
        data = new ITvlModule.Data[](length);
        uint256 index = 0;
        for (uint256 i = 0; i < responses.length; i++) {
            for (uint256 j = 0; j < responses[i].length; j++) {
                data[index++] = responses[i][j];
            }
        }
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address admin
    ) ERC20(name_, symbol_) DefaultAccessControl(admin) {
        configurator = new VaultConfigurator();
    }

    /// @inheritdoc IVault
    function addToken(address token) external nonReentrant {
        _requireAdmin();
        if (token == address(0)) revert InvalidToken();
        if (_isUnderlyingToken[token]) revert InvalidToken();
        if (token == address(this)) revert InvalidToken();
        _isUnderlyingToken[token] = true;
        address[] storage tokens = _underlyingTokens;
        tokens.push(token);
        uint256 n = tokens.length;
        uint256 index = 0;
        for (uint256 i = 1; i < n; i++) {
            address token_ = tokens[n - 1 - i];
            if (token_ < token) {
                index = n - i;
                break;
            }
            tokens[n - i] = token_;
        }
        tokens[index] = token;
        emit TokenAdded(token);
    }

    /// @inheritdoc IVault
    function removeToken(address token) external nonReentrant {
        _requireAdmin();
        if (!_isUnderlyingToken[token]) revert InvalidToken();
        (address[] memory tokens, uint256[] memory amounts) = underlyingTvl();
        uint256 index = tokens.length;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == token) {
                if (amounts[i] != 0) revert NonZeroValue();
                index = i;
                break;
            }
        }
        _isUnderlyingToken[token] = false;
        while (index + 1 < tokens.length) {
            _underlyingTokens[index] = tokens[index + 1];
            index++;
        }
        _underlyingTokens.pop();
        emit TokenRemoved(token);
    }

    /// @inheritdoc IVault
    function addTvlModule(address module) external nonReentrant {
        _requireAdmin();
        ITvlModule.Data[] memory data = ITvlModule(module).tvl(address(this));
        for (uint256 i = 0; i < data.length; i++) {
            if (!_isUnderlyingToken[data[i].underlyingToken])
                revert InvalidToken();
        }
        if (!_tvlModules.add(module)) {
            revert AlreadyAdded();
        }
        emit TvlModuleAdded(module);
    }

    /// @inheritdoc IVault
    function removeTvlModule(address module) external nonReentrant {
        _requireAdmin();
        if (!_tvlModules.contains(module)) revert InvalidState();
        _tvlModules.remove(module);
        emit TvlModuleRemoved(module);
    }

    /// @inheritdoc IVault
    function externalCall(
        address to,
        bytes calldata data
    ) external nonReentrant returns (bool success, bytes memory response) {
        _requireAtLeastOperator();
        if (configurator.isDelegateModuleApproved(to)) revert Forbidden();
        IValidator validator = IValidator(configurator.validator());
        validator.validate(
            msg.sender,
            address(this),
            abi.encodeWithSelector(msg.sig, to, data)
        );
        validator.validate(address(this), to, data);
        (success, response) = to.call(data);
        emit ExternalCall(to, data, success, response);
    }

    /// @inheritdoc IVault
    function delegateCall(
        address to,
        bytes calldata data
    ) external returns (bool success, bytes memory response) {
        _requireAtLeastOperator();
        if (!configurator.isDelegateModuleApproved(to)) revert Forbidden();
        IValidator validator = IValidator(configurator.validator());
        validator.validate(
            msg.sender,
            address(this),
            abi.encodeWithSelector(msg.sig, to, data)
        );
        validator.validate(address(this), to, data);
        (success, response) = to.delegatecall(data);
        emit DelegateCall(to, data, success, response);
    }

    /// @inheritdoc IVault
    function deposit(
        address to,
        uint256[] memory amounts,
        uint256 minLpAmount,
        uint256 deadline
    )
        external
        nonReentrant
        checkDeadline(deadline)
        returns (uint256[] memory actualAmounts, uint256 lpAmount)
    {
        if (configurator.isDepositLocked()) revert Forbidden();
        IValidator(configurator.validator()).validate(
            msg.sender,
            address(this),
            abi.encodeWithSelector(msg.sig)
        );
        (
            address[] memory tokens,
            uint256[] memory totalAmounts
        ) = underlyingTvl();
        if (tokens.length != amounts.length) revert InvalidLength();
        uint128[] memory ratiosX96 = IRatiosOracle(configurator.ratiosOracle())
            .getTargetRatiosX96(address(this), true);

        uint256 ratioX96 = type(uint256).max;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (ratiosX96[i] == 0) continue;
            uint256 ratioX96_ = FullMath.mulDiv(amounts[i], Q96, ratiosX96[i]);
            if (ratioX96_ < ratioX96) ratioX96 = ratioX96_;
        }
        if (ratioX96 == 0) revert ValueZero();

        uint256 depositValue = 0;
        uint256 totalValue = 0;
        actualAmounts = new uint256[](tokens.length);
        IPriceOracle priceOracle = IPriceOracle(configurator.priceOracle());
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 priceX96 = priceOracle.priceX96(address(this), tokens[i]);
            totalValue += totalAmounts[i] == 0
                ? 0
                : FullMath.mulDivRoundingUp(totalAmounts[i], priceX96, Q96);
            if (ratiosX96[i] == 0) continue;
            uint256 amount = FullMath.mulDiv(ratioX96, ratiosX96[i], Q96);
            IERC20(tokens[i]).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
            actualAmounts[i] = amount;
            depositValue += FullMath.mulDiv(amount, priceX96, Q96);
        }

        lpAmount = _processLpAmount(to, depositValue, totalValue, minLpAmount);
        emit Deposit(to, actualAmounts, lpAmount);
        address callback = configurator.depositCallback();
        if (callback == address(0)) return (actualAmounts, lpAmount);
        IDepositCallback(callback).depositCallback(actualAmounts, lpAmount);
        emit DepositCallback(callback, actualAmounts, lpAmount);
    }

    function _processLpAmount(
        address to,
        uint256 depositValue,
        uint256 totalValue,
        uint256 minLpAmount
    ) private returns (uint256 lpAmount) {
        uint256 totalSupply = totalSupply();
        if (totalSupply == 0) {
            // scenario for initial deposit
            _requireAtLeastOperator();
            lpAmount = minLpAmount;
            if (lpAmount == 0) revert ValueZero();
            if (to != address(this)) revert Forbidden();
        } else {
            lpAmount = FullMath.mulDiv(depositValue, totalSupply, totalValue);
            if (lpAmount < minLpAmount) revert InsufficientLpAmount();
            if (to == address(0)) revert AddressZero();
        }

        if (lpAmount + totalSupply > configurator.maximalTotalSupply())
            revert LimitOverflow();
        _mint(to, lpAmount);
    }

    /// @inheritdoc IVault
    function emergencyWithdraw(
        uint256[] memory minAmounts,
        uint256 deadline
    )
        external
        nonReentrant
        checkDeadline(deadline)
        returns (uint256[] memory actualAmounts)
    {
        uint256 timestamp = block.timestamp;
        address sender = msg.sender;
        if (!_pendingWithdrawers.contains(sender)) revert InvalidState();
        WithdrawalRequest memory request = _withdrawalRequest[sender];
        if (timestamp > request.deadline) {
            _cancelWithdrawalRequest(sender);
            return actualAmounts;
        }

        if (
            request.timestamp + configurator.emergencyWithdrawalDelay() >
            timestamp
        ) revert InvalidState();

        uint256 totalSupply = totalSupply();
        (address[] memory tokens, uint256[] memory amounts) = baseTvl();
        if (minAmounts.length != tokens.length) revert InvalidLength();
        actualAmounts = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            if (amounts[i] == 0) {
                if (minAmounts[i] != 0) revert InsufficientAmount();
                continue;
            }
            uint256 amount = FullMath.mulDiv(
                IERC20(tokens[i]).balanceOf(address(this)),
                request.lpAmount,
                totalSupply
            );
            if (amount < minAmounts[i]) revert InsufficientAmount();
            IERC20(tokens[i]).safeTransfer(request.to, amount);
            actualAmounts[i] = amount;
        }
        delete _withdrawalRequest[sender];
        _pendingWithdrawers.remove(sender);
        _burn(address(this), request.lpAmount);
        emit EmergencyWithdrawal(sender, request, actualAmounts);
    }

    /// @inheritdoc IVault
    function cancelWithdrawalRequest() external nonReentrant {
        address sender = msg.sender;
        if (!_pendingWithdrawers.contains(sender)) return;
        _cancelWithdrawalRequest(sender);
    }

    function _cancelWithdrawalRequest(address sender) private {
        WithdrawalRequest memory request = _withdrawalRequest[sender];
        delete _withdrawalRequest[sender];
        _pendingWithdrawers.remove(sender);
        _transfer(address(this), sender, request.lpAmount);
        emit WithdrawalRequestCanceled(sender, tx.origin);
    }

    /// @inheritdoc IVault
    function registerWithdrawal(
        address to,
        uint256 lpAmount,
        uint256[] memory minAmounts,
        uint256 deadline,
        uint256 requestDeadline,
        bool closePrevious
    )
        external
        nonReentrant
        checkDeadline(deadline)
        checkDeadline(requestDeadline)
    {
        uint256 timestamp = block.timestamp;
        address sender = msg.sender;
        if (_pendingWithdrawers.contains(sender)) {
            if (!closePrevious) revert InvalidState();
            _cancelWithdrawalRequest(sender);
        }
        uint256 balance = balanceOf(sender);
        if (lpAmount > balance) lpAmount = balance;
        if (lpAmount == 0) revert ValueZero();
        if (to == address(0)) revert AddressZero();

        address[] memory tokens = _underlyingTokens;
        if (tokens.length != minAmounts.length) revert InvalidLength();

        WithdrawalRequest memory request = WithdrawalRequest({
            to: to,
            lpAmount: lpAmount,
            tokensHash: keccak256(abi.encode(tokens)),
            minAmounts: minAmounts,
            deadline: requestDeadline,
            timestamp: timestamp
        });
        _withdrawalRequest[sender] = request;
        _pendingWithdrawers.add(sender);
        _transfer(sender, address(this), lpAmount);
        emit WithdrawalRequested(sender, request);
    }

    /// @inheritdoc IVault
    function analyzeRequest(
        ProcessWithdrawalsStack memory s,
        WithdrawalRequest memory request
    ) public pure returns (bool, bool, uint256[] memory expectedAmounts) {
        uint256 lpAmount = request.lpAmount;
        if (
            request.tokensHash != s.tokensHash || request.deadline < s.timestamp
        ) return (false, false, expectedAmounts);

        uint256 value = FullMath.mulDiv(lpAmount, s.totalValue, s.totalSupply);
        value = FullMath.mulDiv(value, D9 - s.feeD9, D9);
        uint256 coefficientX96 = FullMath.mulDiv(value, Q96, s.ratiosX96Value);

        uint256 length = s.erc20Balances.length;
        expectedAmounts = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            uint256 ratiosX96 = s.ratiosX96[i];
            expectedAmounts[i] = ratiosX96 == 0
                ? 0
                : FullMath.mulDiv(coefficientX96, ratiosX96, Q96);
            if (expectedAmounts[i] >= request.minAmounts[i]) continue;
            return (false, false, expectedAmounts);
        }
        for (uint256 i = 0; i < length; i++) {
            if (s.erc20Balances[i] >= expectedAmounts[i]) continue;
            return (true, false, expectedAmounts);
        }
        return (true, true, expectedAmounts);
    }

    /// @inheritdoc IVault
    function calculateStack()
        public
        view
        returns (ProcessWithdrawalsStack memory s)
    {
        (address[] memory tokens, uint256[] memory amounts) = underlyingTvl();
        s = ProcessWithdrawalsStack({
            tokens: tokens,
            ratiosX96: IRatiosOracle(configurator.ratiosOracle())
                .getTargetRatiosX96(address(this), false),
            erc20Balances: new uint256[](tokens.length),
            totalSupply: totalSupply(),
            totalValue: 0,
            ratiosX96Value: 0,
            timestamp: block.timestamp,
            feeD9: configurator.withdrawalFeeD9(),
            tokensHash: keccak256(abi.encode(tokens))
        });

        IPriceOracle priceOracle = IPriceOracle(configurator.priceOracle());
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 priceX96 = priceOracle.priceX96(address(this), tokens[i]);
            s.totalValue += FullMath.mulDiv(amounts[i], priceX96, Q96);
            s.ratiosX96Value += FullMath.mulDiv(s.ratiosX96[i], priceX96, Q96);
            s.erc20Balances[i] = IERC20(tokens[i]).balanceOf(address(this));
        }
    }

    /// @inheritdoc IVault
    function processWithdrawals(
        address[] memory users
    ) external nonReentrant returns (bool[] memory statuses) {
        _requireAtLeastOperator();
        statuses = new bool[](users.length);
        ProcessWithdrawalsStack memory s = calculateStack();
        uint256 burningSupply = 0;
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (!_pendingWithdrawers.contains(user)) continue;
            WithdrawalRequest memory request = _withdrawalRequest[user];
            (
                bool isProcessingPossible,
                bool isWithdrawalPossible,
                uint256[] memory expectedAmounts
            ) = analyzeRequest(s, request);

            if (!isProcessingPossible) {
                _cancelWithdrawalRequest(user);
                continue;
            }

            if (!isWithdrawalPossible) continue;

            for (uint256 j = 0; j < s.tokens.length; j++) {
                s.erc20Balances[j] -= expectedAmounts[j];
                IERC20(s.tokens[j]).safeTransfer(
                    request.to,
                    expectedAmounts[j]
                );
            }

            burningSupply += request.lpAmount;
            delete _withdrawalRequest[user];
            _pendingWithdrawers.remove(user);
            statuses[i] = true;
        }

        if (burningSupply == 0) return statuses;
        _burn(address(this), burningSupply);
        emit WithdrawalsProcessed(users, statuses);

        address callback = configurator.withdrawalCallback();
        if (callback == address(0)) return statuses;
        IWithdrawalCallback(callback).withdrawalCallback();
        emit WithdrawCallback(callback);
    }

    receive() external payable {}

    // function _update(
    //     address from,
    //     address to,
    //     uint256 value
    // ) internal override {
    //     if (configurator.areTransfersLocked()) {
    //         address this_ = address(this);
    //         address zero_ = address(0);
    //         if (from != this_ && to != this_ && from != zero_ && to != zero_)
    //             revert Forbidden();
    //     }

    //     super._update(from, to, value);
    // }
}
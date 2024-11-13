// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.24;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// contract MinimalMockMellowVault is ERC20 {

//     using EnumerableSet for EnumerableSet.AddressSet;
//     using SafeERC20 for IERC20;

//     address[] private _underlyingTokens;
//     EnumerableSet.AddressSet private _pendingWithdrawers;

//     mapping(address => WithdrawalRequest) private _withdrawalRequest;

//     error Deadline();
//     error ValueZero();
//     error Forbidden();
//     error InsufficientLpAmount();
//     error AddressZero();
//     error InvalidState();
//     error InvalidLength();

//     event Deposit(address to, uint256[] actualAmounts, uint256 LPAmount);
//     event DepositCallback(address callback, uint256[] actualAmounts, uint256 LPAmount);
//     event WithdrawalRequestCanceled(address sender, address origin);

//     modifier checkDeadline(uint256 deadline) {
//         if (deadline < block.timestamp) revert Deadline();
//         _;
//     }

//     constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

//     function deposit(address to, uint256[] memory amounts, uint256 minLpAmount, uint256 deadline) external checkDeadline(deadline) returns (uint256[] memory actualAmounts, uint256 lpAmount) {

//         (
//             address[] memory tokens,
//             uint256[] memory totalAmounts
//         ) = underlyingTvl();

//             IERC20(tokens[i]).safeTransferFrom(msg.sender, address(this), amount);

//             actualAmounts[i] = amount;
//             depositValue += FullMath.mulDiv(amount, priceX96, Q96);

//         lpAmount = _processLpAmount(to, depositValue, totalValue, minLpAmount);
//         emit Deposit(to, actualAmounts, lpAmount);
//         emit DepositCallback(callback, actualAmounts, lpAmount);
//     }
//     function registerWithdrawal(address to, uint256 lpAmount, uint256[] memory minAmounts, uint256 deadline, uint256 requestDeadline, bool closePrevious) external checkDeadline(deadline) checkDeadline(requestDeadline) {

//         uint256 timestamp = block.timestamp;
//         address sender = msg.sender;
//         if (_pendingWithdrawers.contains(sender)) {
//             if (!closePrevious) revert InvalidState();
//             _cancelWithdrawalRequest(sender);
//         }
//         uint256 balance = balanceOf(sender);
//         if (lpAmount > balance) lpAmount = balance;
//         if (lpAmount == 0) revert ValueZero();
//         if (to == address(0)) revert AddressZero();

//         address[] memory tokens = _underlyingTokens;
//         if (tokens.length != minAmounts.length) revert InvalidLength();

//         WithdrawalRequest memory request = WithdrawalRequest({
//             to: to,
//             lpAmount: lpAmount,
//             tokensHash: keccak256(abi.encode(tokens)),
//             minAmounts: minAmounts,
//             deadline: requestDeadline,
//             timestamp: timestamp
//         });
//         _withdrawalRequest[sender] = request;
//         _pendingWithdrawers.add(sender);
//         _transfer(sender, address(this), lpAmount);
//         emit WithdrawalRequested(sender, request);
//     }
//     function _cancelWithdrawalRequest(address sender) private {

//         WithdrawalRequest memory request = _withdrawalRequest[sender];
//         delete _withdrawalRequest[sender];
//         _pendingWithdrawers.remove(sender);
//         _transfer(address(this), sender, request.lpAmount);
//         emit WithdrawalRequestCanceled(sender, tx.origin);
//     }
//     function analyzeRequest(ProcessWithdrawalsStack memory s, WithdrawalRequest memory request) public pure returns (bool, bool, uint256[] memory expectedAmounts) {
//         uint256 lpAmount = request.lpAmount;
//         if (
//             request.tokensHash != s.tokensHash || request.deadline < s.timestamp
//         ) return (false, false, expectedAmounts);

//         uint256 value = FullMath.mulDiv(lpAmount, s.totalValue, s.totalSupply);
//         value = FullMath.mulDiv(value, D9 - s.feeD9, D9);
//         uint256 coefficientX96 = FullMath.mulDiv(value, Q96, s.ratiosX96Value);

//         uint256 length = s.erc20Balances.length;
//         expectedAmounts = new uint256[](length);
//         for (uint256 i = 0; i < length; i++) {
//             uint256 ratiosX96 = s.ratiosX96[i];
//             expectedAmounts[i] = ratiosX96 == 0
//                 ? 0
//                 : FullMath.mulDiv(coefficientX96, ratiosX96, Q96);
//             if (expectedAmounts[i] >= request.minAmounts[i]) continue;
//             return (false, false, expectedAmounts);
//         }
//         for (uint256 i = 0; i < length; i++) {
//             if (s.erc20Balances[i] >= expectedAmounts[i]) continue;
//             return (true, false, expectedAmounts);
//         }
//         return (true, true, expectedAmounts);
//     }
//     function calculateStack() public view returns (ProcessWithdrawalsStack memory s) {
//         (address[] memory tokens, uint256[] memory amounts) = underlyingTvl();
//         s = ProcessWithdrawalsStack({
//             tokens: tokens,
//             ratiosX96: IRatiosOracle(configurator.ratiosOracle())
//                 .getTargetRatiosX96(address(this), false),
//             erc20Balances: new uint256[](tokens.length),
//             totalSupply: totalSupply(),
//             totalValue: 0,
//             ratiosX96Value: 0,
//             timestamp: block.timestamp,
//             feeD9: configurator.withdrawalFeeD9(),
//             tokensHash: keccak256(abi.encode(tokens))
//         });

//         IPriceOracle priceOracle = IPriceOracle(configurator.priceOracle());
//         for (uint256 i = 0; i < tokens.length; i++) {
//             uint256 priceX96 = priceOracle.priceX96(address(this), tokens[i]);
//             s.totalValue += FullMath.mulDiv(amounts[i], priceX96, Q96);
//             s.ratiosX96Value += FullMath.mulDiv(s.ratiosX96[i], priceX96, Q96);
//             s.erc20Balances[i] = IERC20(tokens[i]).balanceOf(address(this));
//         }
//     }
    
//     function withdrawalRequest(address user) external view returns (WithdrawalRequest memory) {
//         return _withdrawalRequest[user];
//     }

//      function underlyingTvl() public view returns (address[] memory tokens, uint256[] memory amounts) {
//         tokens = _underlyingTokens;
//         amounts = _calculateTvl(tokens, true);
//     }

//     function _calculateTvl(address[] memory tokens, bool isUnderlying) private view returns (uint256[] memory amounts) {

//         amounts = new uint256[](tokens.length);
//         uint256[] memory negativeAmounts = new uint256[](tokens.length);
//         ITvlModule.Data[] memory tvl_ = _tvls();
//         ITvlModule.Data memory data;
//         for (uint256 i = 0; i < tvl_.length; i++) {
//             data = tvl_[i];
//             (uint256 amount, address token) = isUnderlying
//                 ? (data.underlyingAmount, data.underlyingToken)
//                 : (data.amount, data.token);
//             for (uint256 j = 0; j < tokens.length; j++) {
//                 if (token != tokens[j]) continue;
//                 (data.isDebt ? negativeAmounts : amounts)[j] += amount;
//                 break;
//             }
//         }
//         for (uint256 i = 0; i < tokens.length; i++) {
//             if (amounts[i] < negativeAmounts[i]) revert InvalidState();
//             amounts[i] -= negativeAmounts[i];
//         }
//     }

//     function _processLpAmount(address to, uint256 depositValue, uint256 totalValue, uint256 minLpAmount) private returns (uint256 lpAmount) {
        
//         uint256 totalSupply = totalSupply();
//         if (totalSupply == 0) {
//             lpAmount = minLpAmount;
//             if (lpAmount == 0) revert ValueZero();
//             if (to != address(this)) revert Forbidden();
//         } else {
//             lpAmount = FullMath.mulDiv(depositValue, totalSupply, totalValue);
//             if (lpAmount < minLpAmount) revert InsufficientLpAmount();
//             if (to == address(0)) revert AddressZero();
//         }

//         _mint(to, lpAmount);
//     }
// }
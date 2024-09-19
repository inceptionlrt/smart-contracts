// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "../interfaces/IInceptionToken.sol";

contract MockCToken is IInceptionToken {
    string private constant _name = "Mock cToken";
    string private constant _symbol = "mCTkn";
    uint256 public totalSupply;
    address public governance;

    mapping(address => uint256) private balances;

    event NameChanged(string newName);
    event SymbolChanged(string newSymbol);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed account, uint256 value);
    event Burn(address indexed account, uint256 value);

    modifier onlyGovernance() {
        require(msg.sender == governance, "Not governance");
        _;
    }

    constructor() {
        governance = msg.sender;
    }

    function mint(address account, uint256 shares) external {
        balances[account] += shares;
        totalSupply += shares;
        emit Mint(account, shares);
    }

    function burn(address account, uint256 shares) external {
        require(balances[account] >= shares, "Not enough shares");
        balances[account] -= shares;
        totalSupply -= shares;
        emit Burn(account, shares);
    }

    function convertToAmount(uint256 shares) public pure returns (uint256) {
        return shares;
    }

    function convertToShares(uint256 amount) public pure returns (uint256) {
        return amount;
    }

    function changeName(string memory newName) external onlyGovernance {
        //just to implement interface
    }

    function changeSymbol(string memory newSymbol) external onlyGovernance {
        //just to implement interface
    }

    function name() public pure returns (string memory) {
        return _name;
    }

    function symbol() public pure returns (string memory) {
        return _symbol;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}

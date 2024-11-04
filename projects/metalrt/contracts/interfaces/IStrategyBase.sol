interface IStrategyBase {
    function deposit(uint256 _amount) external returns (uint256);
    function withdraw(uint256 _amount) external returns (uint256);
}

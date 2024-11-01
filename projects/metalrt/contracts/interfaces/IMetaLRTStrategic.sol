interface IMetaLRTStrategic {

    struct StrategyStats {
      uint256 allocation;
      uint256 deposit;
      bool active;
    }

    // --- Events ---
    event ToleranceSet(uint256 tolerance, uint256 _tolerance);

    error NotSOperatorOrOwner();
}
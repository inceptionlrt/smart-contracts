interface IMetaLRTCore {

    // --- Errors ---
    error MetaLRTBasicMaxMargin();
    error MetaLRTBasicInvalidAmount();
    error MetaLRTBasicZeroAddress();

    // --- Events ---
    event Claim(address indexed owner, address indexed receiver, uint256 yield);
    event YieldHeritor(address oldHeritor, address newHeritor);
    event YieldMargin(uint256 oldMargin, uint256 newMargin);
    event AdapterChanged(address oldAdapter, address newAdapter);
}
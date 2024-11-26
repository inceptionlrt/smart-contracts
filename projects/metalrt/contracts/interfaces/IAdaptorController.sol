
interface IAdaptorController {

    // --- Events ---
    event RequestDelegate(address indexed _adaptor, uint256 indexed _assets);
    event RequestUndelegate(address indexed _adaptor, uint256 indexed _assets);
    event RequestClaim();
    event AdaptorAdded(address indexed _adaptor);
    event AllocationsSet(address indexed _adaptor, uint256 indexed _oldAllocation, uint256 indexed _newAllocation);
    event YieldHeritorSet(address indexed _oldHeritor, address indexed _newHeritor);
    event OperatorSet(address indexed _oldOperator, address indexed _newOperator);

    // --- Errors ---
    error AdaptorController_OnlyVault();
    error AdaptorController_NoAdaptors();
    error AdaptorController_InvalidAddress();
    error AdaptorController_NotOperatorOrOwner();
    error AdaptorController_Duplicate();
    
    // --- Functions ---
    function asset() external view returns (address);
    function vault() external view returns (address);
    function totalAssets() external view returns (uint256 _sum);
    function totalAssets(address _adaptor) external view returns (uint256 _sum);
    function totalAssetsPerAdaptor() external view returns (uint256[] memory _assets);
    function isAdaptor(address _adaptor) external returns (bool);
    function yieldHeritor() external view returns (address);
    function operator() external view returns (address);
    function priceController() external returns (address);
    function requestDelegate(address _adaptor, uint256 _assets) external;
    function requestUndelegate(address _adaptor, uint256 _assets) external;
    function requestClaim(address _adadptor) external;
}
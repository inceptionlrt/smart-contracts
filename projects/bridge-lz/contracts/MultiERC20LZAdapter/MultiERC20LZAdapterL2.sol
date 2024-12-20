// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IGenericERC20Bridge} from "../interfaces/IGenericERC20Bridge.sol";

contract MultiERC20LZAdapterL2 {
    struct ReportEntry {
        uint256 timestamp;
        address iovAddr;
        address underlyingAssetAddr;
        uint256 inceptionTokenSupply;
        uint256 underlyingAssetBalance;
    }

    event ReportSubmitted(address indexed iovAddr, address indexed underlyingAssetAddr, uint256 incTokenSupply, uint256 uAssetBalance);
    event ReportsSentToL1(); // todo
    event BridgingComplete(); // todo
    event VaultAuthorizationChanged(address indexed vault, bool newStatus);
    event BridgeAdded(address indexed asset, address indexed bridge);
    event BridgingRequestSubmitted(address indexed asset, uint256 amount);
    event BridgingFailed(address indexed asset, uint256 amount);
    event EmergencyRecoveryAuthorized(address indexed authedAddr, address indexed asset, uint256 amount);

    using SafeERC20 for IERC20;

    mapping(address=>bool) public authorizedVaults;

    ReportEntry[] public pendingReports;
    uint256 public pendingRepCount;
    mapping(address=>uint256) public iovAddrToReportIdx;
    mapping(address=>uint256) public assetAddrToReportIdx;
    // if the value returned by these mappings is bigger than pendingRepCount, then it means this iov/asset hasn't submitted anything new

    address[] public pendingAssetsToBridge;
    uint256 public pendingBridgeCount;
    mapping(address=>uint256) public pendingAssetAmounts;

    mapping(address=>IGenericERC20Bridge) public bridges;

    modifier onlyAuthVaults() {
        require(authorizedVaults[msg.sender], "Not an authorized vault");
        _;
    }

    function setAuthVault(address _iov, bool _access) external /* onlyOwner */ {
        require(_iov != address(0), "Zero iov addr");
        authorizedVaults[_iov] = _access;
        emit VaultAuthorizationChanged(_iov, _access);
    }

    function setBridgeForAsset(address _asset, address _bridge) external /* onlyOwner */ {
        require(_asset != address(0) && _bridge != address(0), "Zero addr");
        bridges[_asset] = IGenericERC20Bridge(_bridge);
        emit BridgeAdded(_asset, _bridge);
    }

    function reportHoldings(address _asset, uint256 _incSupply, uint256 _assetBalance) external onlyAuthVaults {
        require(address(bridges[_asset]) != address(0), "Unknown asset type");

        ReportEntry storage entry = pendingReports.push();
        iovAddrToReportIdx[msg.sender] = pendingRepCount;
        assetAddrToReportIdx[_asset] = pendingRepCount;
        pendingRepCount++;

        entry.timestamp = block.timestamp;
        entry.iovAddr = msg.sender;
        entry.underlyingAssetAddr = _asset;
        entry.inceptionTokenSupply = _incSupply;
        entry.underlyingAssetBalance = _assetBalance;

        emit ReportSubmitted(msg.sender, _asset, _incSupply, _assetBalance);
        // Maybe we can compare the data with the previous report, so in case nothing has changed we don't send anything later
    }

    function sendToL1() external /* onlyOwner */ {
        require(pendingRepCount != 0, "Nothing to report");
        // do_lz_magic(pendingReports);
        pendingRepCount = 0;

        emit ReportsSentToL1();
    }

    function prepareBridging(address _asset, uint256 _amount) external onlyAuthVaults {
        // Pull assets from iov for later batch bridging
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), _amount);
        pendingAssetsToBridge.push() = _asset;
        pendingAssetAmounts[_asset] = _amount;
        pendingBridgeCount++;
    }

    function executeBridging() external /* onlyOwner */ {
        for(uint256 i=0; i != pendingBridgeCount; ) {
            address asset = pendingAssetsToBridge[i];
            bool success = bridges[asset].bridge(pendingAssetAmounts[asset]);
            if(!success) {
                emit BridgingFailed(asset, pendingAssetAmounts[asset]);
            } // soft fail in order to not stop the rest of the batch
            pendingAssetAmounts[pendingAssetsToBridge[i]] = 0;
            unchecked { ++i; }
        }
        pendingBridgeCount = 0;
        emit BridgingComplete();
    }

    // Emergency recovery function. Authorizes owner to spend contract's tokens
    function authorizeAssetRecovery(address _asset, uint256 _amount) external /* onlyOwner */ {
        IERC20(_asset).approve(msg.sender, _amount);
        emit EmergencyRecoveryAuthorized(msg.sender, _asset, _amount);
    }
}
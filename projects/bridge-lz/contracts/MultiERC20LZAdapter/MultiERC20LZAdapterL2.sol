// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;


contract MultiERC20LZAdapterL2 {
    struct ReportEntry {
        uint256 timestamp;
        address iovAddr;
        address underlyingAssetAddr;
        uint256 inceptionTokenSupply;
        uint256 underlyingAssetBalance;
    }

    event ReportSubmitted(address indexed iovAddr, address indexed underlyingAssetAddr, uint256 incTokenSupply, uint256 uAssetBalance);
    event SentToL1(); // todo
    event VaultAuthorizationChanged(address indexed vault, bool newStatus);

    mapping(address=>bool) public authorizedVaults;

    ReportEntry[] public pendingReports;
    uint256 public pendingRepCount;
    mapping(address=>uint256) public iovAddrToReportIdx;
    mapping(address=>uint256) public assetAddrToReportIdx;
    // if the value returned by these mappings is bigger than pendingRepCount, then it means this iov/asset hasn't submitted anything new

    modifier onlyAuthVaults() {
        require(authorizedVaults[msg.sender], "Not an authorized vault");
        _;
    }

    function reportHoldings(address _asset, uint256 _incSupply, uint256 _assetBalance) external onlyAuthVaults {
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

        emit SentToL1();
    }
}
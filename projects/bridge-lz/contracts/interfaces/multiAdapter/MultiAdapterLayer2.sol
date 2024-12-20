// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

interface MultiAdapterLayer2 {
    /**
     * @dev onlyOperator is allowed
     * @notice this requires all IOV to sent data beforehand
     */
    function sendAssetInfoBatch() external;

    /**
     * @dev returns the LZ fees for the sending the current batch of data
     */
    function quoteSendAssetInfoBatch() external view;
}

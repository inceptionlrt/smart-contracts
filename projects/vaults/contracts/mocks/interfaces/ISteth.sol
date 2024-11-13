// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

interface ISteth {
    function submit(address _referral) external payable returns (uint256);

    function getBufferedEther() external view returns (uint256);
}
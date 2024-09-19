// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "../interfaces/IRestakingPool.sol";
import "../interfaces/IInceptionToken.sol";
import "../interfaces/IInceptionRatioFeed.sol";

contract MockRestakingPool is IRestakingPool {
    IInceptionToken public inceptionToken;
    IInceptionRatioFeed public inceptionRatioFeed;

    event Deposited(address indexed user, uint256 amount);

    constructor(address _inceptionToken, address _inceptionRatioFeed) {
        require(_inceptionToken != address(0), "Invalid token address");
        require(
            _inceptionRatioFeed != address(0),
            "Invalid ratio feed address"
        );
        inceptionToken = IInceptionToken(_inceptionToken);
        inceptionRatioFeed = IInceptionRatioFeed(_inceptionRatioFeed);
    }

    function stake() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        uint256 amount = inceptionRatioFeed.getRatioFor(
            address(inceptionToken)
        ) * msg.value;
        inceptionToken.mint(msg.sender, amount);
        emit Deposited(msg.sender, msg.value);
    }

    // The following functions are required by the IRestakingPool interface but will be left unimplemented for the mock.

    function getMinStake() external pure override returns (uint256) {
        return 1;
    }

    function getMinUnstake() external pure override returns (uint256) {
        return 1;
    }
}

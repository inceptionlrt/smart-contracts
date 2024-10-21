// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./IRatioFeed.sol";
import "./ICToken.sol";
import "./IRestakingPool.sol";
import "./IEigenPodManager.sol";
import "../restaker/IRestakerDeployer.sol";
import "./IRebalancer.sol";

interface IProtocolConfig {
    /* errors */

    error OnlyGovernanceAllowed();
    error ZeroAddress();

    /* events */
    event OperatorChanged(address prevValue, address newValue);
    event GovernanceChanged(address prevValue, address newValue);
    event TreasuryChanged(address prevValue, address newValue);
    event RatioFeedChanged(IRatioFeed prevValue, IRatioFeed newValue);
    event CTokenChanged(ICToken prevValue, ICToken newValue);
    event RestakingPoolChanged(
        IRestakingPool prevValue,
        IRestakingPool newValue
    );
    event RebalancerChanged(IRebalancer prevValue, IRebalancer newValue);
    event EigenManagerChanged(
        IEigenPodManager prevValue,
        IEigenPodManager newValue
    );
    event RestakerDeployerChanged(
        IRestakerDeployer prevValue,
        IRestakerDeployer newValue
    );

    /* functions */

    function getGovernance() external view returns (address governance);

    function getTreasury() external view returns (address treasury);

    function getOperator() external view returns (address operator);

    function getCToken() external view returns (ICToken token);

    function getRatioFeed() external view returns (IRatioFeed feed);

    function getRestakingPool() external view returns (IRestakingPool pool);

    function getRebalancer() external view returns (IRebalancer rebalancer);

    function getRestakerDeployer()
        external
        view
        returns (IRestakerDeployer deployer);
}

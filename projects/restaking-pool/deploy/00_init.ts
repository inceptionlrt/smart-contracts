import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { ozDeploy } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ getNamedAccounts, deployments }) {
  const { deploy, execute } = deployments;
  const { deployer, operator, governance, treasury, elPodManager, elDelegationManager } = await getNamedAccounts();

  const config = await ozDeploy(deployments, "ProtocolConfig", [deployer, operator, treasury]);

  const ratioFeed = await ozDeploy(deployments, "RatioFeed", [config.address, "40000"]);

  const cToken = await ozDeploy(deployments, "cToken", [config.address, "GenesisLRT restaked ETH", "genETH"]);

  const restakingPool = await ozDeploy(deployments, "RestakingPool", [
    config.address,
    "200000",
    "200000000000000000000", // 200 ETH
  ]);

  await ozDeploy(deployments, "FeeCollector", [
    config.address,
    "1500", // 15%
  ]);

  const executeCfg = {
    from: deployer,
    log: true,
  };

  const res = await execute(
    "RestakingPool",
    executeCfg,
    "setMinStake",
    "100", // wei
  );

  await execute(
    "RestakingPool",
    executeCfg,
    "setMinUnstake",
    "500000000000000000", // 0.5 Ether
  );

  await execute("ProtocolConfig", executeCfg, "setRatioFeed", ratioFeed.address);

  await execute("ProtocolConfig", executeCfg, "setRestakingPool", restakingPool.address);

  await execute("ProtocolConfig", executeCfg, "setCToken", cToken.address);

  // deploy restaker sub-protocol

  const restakerFacets = await ozDeploy(deployments, "RestakerFacets", [governance, elPodManager, elDelegationManager]);

  const beacon = await upgrades.deployBeacon(await ethers.getContractFactory("Restaker"));
  await beacon.waitForDeployment();

  const restakerDeployer = await deploy("RestakerDeployer", {
    log: true,
    from: deployer,
    args: [await beacon.getAddress(), restakerFacets.address],
  });

  await execute("ProtocolConfig", executeCfg, "setRestakerDeployer", restakerDeployer.address);

  return true;
};

module.exports = func;
module.exports.tags = ["00_init"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "00";

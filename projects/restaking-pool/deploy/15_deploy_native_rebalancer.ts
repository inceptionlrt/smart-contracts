import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { ozDeploy } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ getNamedAccounts, deployments }) {
  const { deployer, operator } = await getNamedAccounts();
  const { get, execute } = deployments;

  const lockboxAddress = "0x1016F41e5b7D192cecE4C38D098A12EbE195CaF4";

  // Load existing contract addresses
  const inceptionToken = await get("cToken");
  const restakingPool = await get("RestakingPool");
  const ratioFeed = await get("RatioFeed");

  const crossChainBridge = "0xC18e569881A00f571526889a37388699f4031ab2"; //TODO! Replace this with actual address
  if (!crossChainBridge) {
    throw new Error("CROSS_CHAIN_BRIDGE environment variable is not set");
  }

  console.log("Deploying NativeRebalancer with:");
  console.log("Deployer:", deployer);
  console.log("Operator:", operator);
  console.log("InceptionToken:", inceptionToken.address);
  console.log("XERC20lockboxAddress:", lockboxAddress);
  console.log("RestakingPool:", restakingPool.address);
  console.log("RatioFeed:", ratioFeed.address);
  console.log("LZCrossChainAdapterL1:", crossChainBridge);

  const nativeRebalancer = await ozDeploy(deployments, "NativeRebalancer", [
    inceptionToken.address,
    lockboxAddress,
    restakingPool.address,
    crossChainBridge,
    ratioFeed.address,
    operator
  ]);

  console.log("NativeRebalancer deployed at:", nativeRebalancer.address);

  const executeCfg = { from: deployer, log: true };
  await execute("ProtocolConfig", executeCfg, "setRebalancer", nativeRebalancer.address);
  await execute("RestakingPool", executeCfg, "PR", nativeRebalancer.address);

  return true;
};

module.exports = func;
module.exports.tags = ["15_native_rebalancer_deploy"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "15";

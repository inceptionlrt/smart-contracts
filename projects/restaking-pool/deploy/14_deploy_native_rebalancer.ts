import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { ozDeploy } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ getNamedAccounts, deployments }) {
  const { deployer, operator } = await getNamedAccounts();
  const { get, execute } = deployments;

  const lockboxAddress = process.env.XERC20LOCKBOX_ADDRESS;
  if (!lockboxAddress) {
    throw new Error("XERC20LOCKBOX_ADDRESS environment variable is not set");
  }

  // Load existing contract addresses
  const inceptionToken = await get("cToken");
  const liqPool = await get("LiquidityPool");
  const ratioFeed = await get("RatioFeed");

  const crossChainBridge = process.env.CROSS_CHAIN_BRIDGE;
  if (!crossChainBridge) {
    throw new Error("CROSS_CHAIN_BRIDGE environment variable is not set");
  }

  console.log("Deploying NativeRebalancer with:");
  console.log("Deployer:", deployer);
  console.log("Operator:", operator);
  console.log("InceptionToken:", inceptionToken.address);
  console.log("XERC20lockboxAddress:", lockboxAddress);
  console.log("LiquidityPool:", liqPool.address);
  console.log("RatioFeed:", ratioFeed.address);
  console.log("LZCrossChainAdapterL1:", crossChainBridge);

  const nativeRebalancer = await ozDeploy(deployments, "NativeRebalancer", [
    inceptionToken.address,
    lockboxAddress,
    liqPool.address,
    crossChainBridge,
    ratioFeed.address,
    operator
  ]);

  const executeCfg = { from: deployer, log: true };
  await execute("ProtocolConfig", executeCfg, "setRebalancer", nativeRebalancer.address);
  await execute("RestakingPool", executeCfg, "PR", nativeRebalancer.address);

  return true;
};

module.exports = func;
module.exports.tags = ["14_native_rebalancer_deploy"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "14";

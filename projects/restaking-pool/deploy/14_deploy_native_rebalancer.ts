import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { ozDeploy } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ getNamedAccounts, deployments }) {
  const { deployer, operator } = await getNamedAccounts();
  const { get, execute } = deployments;

  // Load existing contract addresses
  const inceptionToken = await get("InceptionToken");
  const lockbox = await get("Lockbox");
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
  console.log("Lockbox:", lockbox.address);
  console.log("LiquidityPool:", liqPool.address);
  console.log("RatioFeed:", ratioFeed.address);
  console.log("CrossChainBridge (default adapter):", crossChainBridge);

  const nativeRebalancer = await ozDeploy(deployments, "NativeRebalancer", [
    inceptionToken.address,
    lockbox.address,
    liqPool.address,
    crossChainBridge,
    ratioFeed.address,
    operator
  ]);

  const executeCfg = { from: deployer, log: true };
  await execute("ProtocolConfig", executeCfg, "setRebalancer", nativeRebalancer.address);

  return true;
};

module.exports = func;
module.exports.tags = ["14_native_rebalancer_deploy"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "14";

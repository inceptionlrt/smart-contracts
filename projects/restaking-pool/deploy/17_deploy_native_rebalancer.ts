import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { ozDeploy } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ getNamedAccounts, deployments, network }) {
  const { deployer, operator } = await getNamedAccounts();
  const { get, execute } = deployments;

  console.log(`deployer address: ${deployer}`);
  console.log(`deployer balance: ${await ethers.provider.getBalance(deployer)}`);

  /// 1. InceptionLibrary Deployment
  let lockboxAddress = "";
  if (network.name === "mainnet") {
    // TODO
    lockboxAddress = "0x1016F41e5b7D192cecE4C38D098A12EbE195CaF4";
  } else {
    // TODO
    lockboxAddress = "TODO";
  }

  // Load existing contract addresses
  const inceptionToken = await get("cToken");
  const restakingPool = await get("RestakingPool");
  const ratioFeed = await get("RatioFeed");

  const crossChainBridge = ""; //TODO! Replace this with actual address
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
    operator,
  ]);

  console.log("NativeRebalancer deployed at:", nativeRebalancer.address);

  const executeCfg = { from: deployer, log: true };
  await execute("ProtocolConfig", executeCfg, "setRebalancer", nativeRebalancer.address);
  await execute("RestakingPool", executeCfg, "PR", nativeRebalancer.address);

  return true;
};

module.exports = func;
module.exports.tags = ["17_native_rebalancer_deploy"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "17";


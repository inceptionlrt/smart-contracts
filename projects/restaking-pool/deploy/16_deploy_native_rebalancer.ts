import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { ozDeploy } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ getNamedAccounts, deployments, network }) {
  const { deployer, operator } = await getNamedAccounts();
  const { get, execute } = deployments;

  console.log(`deployer address: ${deployer}`);
  console.log(`deployer balance: ${await ethers.provider.getBalance(deployer)}`);

  /// 1. InceptionLibrary Deployment
  let lockboxAddress = "0x1016F41e5b7D192cecE4C38D098A12EbE195CaF4";
  if (network.name === "mainnet") {
    // TODO
    lockboxAddress = "0x1016F41e5b7D192cecE4C38D098A12EbE195CaF4";
  } else if (network.name === "holesky" || network.name === "hardhat") {
    lockboxAddress = "0xDb545414FfCcd1D5E9c626Be95831095c85D26fF";
  }

  // Load existing contract addresses
  const inceptionTokenAddress = "0x76944d54c9eF0a7A563E43226e998F382714C92f";
  // const restakingPool = await get("RestakingPool");
  const restakingPool = { address: "0xEAA6d9f33c7095218Ed9cD4f0D7FB6551A14005f" };
  const ratioFeed = await get("RatioFeed");

  const crossChainBridge = "0xA2c902810eAE3C24208580e043cA0de36Ae66c3E";

  console.log("Deploying NativeRebalancer with:");
  console.log("Deployer:", deployer);
  console.log("Operator:", operator);
  console.log("InceptionToken:", inceptionTokenAddress);
  console.log("XERC20lockboxAddress:", lockboxAddress);
  console.log("RestakingPool:", restakingPool.address);
  console.log("RatioFeed:", ratioFeed.address);
  console.log("LZCrossChainAdapterL1:", crossChainBridge);

  const nativeRebalancer = await ozDeploy(deployments, "NativeRebalancer", [
    inceptionTokenAddress,
    lockboxAddress,
    restakingPool.address,
    crossChainBridge,
    ratioFeed.address,
    operator,
  ]);

  console.log("NativeRebalancer deployed at:", nativeRebalancer.address);

  const executeCfg = { from: deployer, log: true };
  await execute("ProtocolConfig", executeCfg, "setRebalancer", nativeRebalancer.address);

  return true;
};

module.exports = func;
module.exports.tags = ["16_native_rebalancer_deploy"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "16";


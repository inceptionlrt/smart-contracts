import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { ozDeploy } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ getNamedAccounts, deployments, network }) {
  const { deployer, operator } = await getNamedAccounts();
  const { get, execute } = deployments;

  console.log(`deployer address: ${deployer}`);
  console.log(`deployer balance: ${await ethers.provider.getBalance(deployer)}`);

  // Lockbox address
  let lockboxAddress = "";
  if (network.name === "mainnet") {
    // TODO
    lockboxAddress = "0x1016F41e5b7D192cecE4C38D098A12EbE195CaF4";
  } else if (network.name === "holesky") {
    lockboxAddress = "0xDb545414FfCcd1D5E9c626Be95831095c85D26fF";
  }

  // inETH address
  let inceptionTokenAddress = "";
  if (network.name === "mainnet") {
    inceptionTokenAddress = "0xf073bAC22DAb7FaF4a3Dd6c6189a70D54110525C";
  } else if (network.name === "holesky") {
    inceptionTokenAddress = "0x76944d54c9eF0a7A563E43226e998F382714C92f";
  }

  const restakingPool = await get("RestakingPool");
  const ratioFeed = await get("RatioFeed");

  // CrossChainBridge address
  let crossChainBridge = "";
  if (network.name === "mainnet") {
    //TODO fill this for mainnet
    crossChainBridge = "0x1E0Bd0291165F789b794e9513Eb07a76849c1448";
  } else if (network.name === "holesky") {
    crossChainBridge = "0xA2c902810eAE3C24208580e043cA0de36Ae66c3E";
  }

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


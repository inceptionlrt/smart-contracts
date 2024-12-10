import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { ozDeploy } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ getNamedAccounts, deployments, network }) {
  const { deployer } = await getNamedAccounts();
  const { get, execute } = deployments;

  console.log(`deployer address: ${deployer}`);
  console.log(`deployer balance: ${await ethers.provider.getBalance(deployer)}`);

  let lockboxAddress = "";
  let inceptionTokenAddress = "";
  let crossChainBridge = "";
  let operator = "";
  if (network.name === "mainnet") {
    lockboxAddress = "0xb86d7BfB30E4e9552Ba1Dd6208284667DF2E8c0E";
    inceptionTokenAddress = "0xf073bAC22DAb7FaF4a3Dd6c6189a70D54110525C";
    crossChainBridge = "0x1E0Bd0291165F789b794e9513Eb07a76849c1448";
    operator = "0xd87D15b80445EC4251e33dBe0668C335624e54b7"; //address used in inception-service prod
  } else if (network.name === "holesky") {
    lockboxAddress = "0xDb545414FfCcd1D5E9c626Be95831095c85D26fF";
    inceptionTokenAddress = "0x76944d54c9eF0a7A563E43226e998F382714C92f";
    crossChainBridge = "0xA2c902810eAE3C24208580e043cA0de36Ae66c3E";
    operator = "0x292fC68C55572cf8bb680e6eED639899e83D2e06"; //address used in inception-service dev
  }

  const restakingPool = await get("RestakingPool");
  const ratioFeed = await get("RatioFeed");

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


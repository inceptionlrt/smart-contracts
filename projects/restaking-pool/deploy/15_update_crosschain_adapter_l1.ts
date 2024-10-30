import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function ({ deployments }) {
  const { get } = deployments;

  // Retrieve the address of NativeRebalancer from deployments
  const nativeRebalancer = await get("NativeRebalancer");
  console.log("NativeRebalancer address:", nativeRebalancer.address);

  const crossChainBridgeAddress = process.env.CROSS_CHAIN_BRIDGE;
  if (!crossChainBridgeAddress) {
    throw new Error("CROSS_CHAIN_BRIDGE environment variable is not set");
  }

  // Connect to LZCrossChainAdapterL1 directly using ethers.js
  const lzCrossChainAdapterL1 = await ethers.getContractAt("LZCrossChainAdapterL1", crossChainBridgeAddress);

  // Make the contract call to setTargetReceiver
  console.log(`Setting targetReceiver to NativeRebalancer address at ${nativeRebalancer.address}`);
  const tx = await lzCrossChainAdapterL1.setTargetReceiver(nativeRebalancer.address);

  // Wait for transaction confirmation
  await tx.wait();
  console.log("targetReceiver set successfully in transaction:", tx.hash);
};

module.exports = func;
module.exports.tags = ["15_update_crosschain_adapter_l1"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "15";

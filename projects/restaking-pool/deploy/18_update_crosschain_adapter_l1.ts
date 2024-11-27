import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function ({ deployments, network }) {
  const { get } = deployments;

  const nativeRebalancer = await get("NativeRebalancer");
  console.log("NativeRebalancer address:", nativeRebalancer.address);

  let crossChainBridgeAddress = "";
  if (network.name === "mainnet") {
    // TODO
    crossChainBridgeAddress = "";
  } else {
    // TODO
    crossChainBridgeAddress = "";
  }

  if (!crossChainBridgeAddress) {
    throw new Error("CROSS_CHAIN_BRIDGE environment variable is not set");
  }

  const lzCrossChainAdapterL1 = await ethers.getContractAt("ILZCrossChainAdapterL1", crossChainBridgeAddress);

  console.log(`Setting targetReceiver to NativeRebalancer address at ${nativeRebalancer.address}`);
  const tx = await lzCrossChainAdapterL1.setTargetReceiver(nativeRebalancer.address);

  await tx.wait();
  console.log("targetReceiver set successfully in transaction:", tx.hash);
};

module.exports = func;
module.exports.tags = ["18_update_crosschain_adapter_l1"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "18";


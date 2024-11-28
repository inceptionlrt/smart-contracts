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
  } else if (network.name === "holesky") {
    crossChainBridgeAddress = "0xA2c902810eAE3C24208580e043cA0de36Ae66c3E";
  }

  const lzCrossChainAdapterL1 = await ethers.getContractAt("ILZCrossChainAdapterL1", crossChainBridgeAddress);

  console.log(`Setting targetReceiver to NativeRebalancer address at ${nativeRebalancer.address}`);
  const tx = await lzCrossChainAdapterL1.setTargetReceiver(nativeRebalancer.address);

  await tx.wait();
  console.log("targetReceiver set successfully in transaction:", tx.hash);
};

module.exports = func;
module.exports.tags = ["17_update_crosschain_adapter_l1"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "17";


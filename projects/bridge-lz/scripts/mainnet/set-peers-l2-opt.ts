const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
import { zeroPadValue } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();

  const CrossChainBridgeEthereumAddress =
    "0x1E0Bd0291165F789b794e9513Eb07a76849c1448"; //TODO! Insert LZCrossChainBridgeL1 address here
  const CrossChainBridgeOptimismAddress =
    "0x19Ba5CcC603e1224B8502C56087e4147cEDD2522"; //TODO! Insert LZCrossChainBridgeL2 Optimism address here

  if (!CrossChainBridgeEthereumAddress || !CrossChainBridgeOptimismAddress) {
    throw new Error("CrossChainBridge addresses are not set.");
  }

  // Get contract instance
  const CrossChainBridgeOptimism = await ethers.getContractAt(
    "LZCrossChainAdapterL2",
    CrossChainBridgeOptimismAddress,
  );
  const eIdSepolia = 30101; //Ethereum Mainnet eID

  // Set peer for Ethereum Mainnet
  await CrossChainBridgeOptimism.connect(deployer).setPeer(
    eIdSepolia,
    zeroPadValue(CrossChainBridgeEthereumAddress, 32),
  );
  console.log(
    `Bridge at address ${CrossChainBridgeOptimismAddress} was set successfully with peer at address ${CrossChainBridgeEthereumAddress} at Ethereum`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

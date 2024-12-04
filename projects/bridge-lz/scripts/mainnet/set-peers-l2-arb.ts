const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
import { zeroPadValue } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();

  const CrossChainBridgeEthereumAddress =
    "0x1E0Bd0291165F789b794e9513Eb07a76849c1448"; //TODO! Insert LZCrossChainBridgeL1 address here
  const CrossChainBridgeArbitrumAddress =
    "0x19Ba5CcC603e1224B8502C56087e4147cEDD2522"; //TODO! Insert LZCrossChainBridgeL2 Arbitrum address here

  if (!CrossChainBridgeEthereumAddress || !CrossChainBridgeArbitrumAddress) {
    throw new Error(
      "CrossChainBridge addresses not found in the checkpoint files.",
    );
  }

  // Get contract instance
  const CrossChainBridgeOptimism = await ethers.getContractAt(
    "LZCrossChainAdapterL2",
    CrossChainBridgeArbitrumAddress,
  );
  const eIdSepolia = 30101; //Ethereum Mainnet eID

  // Set peer for Ethereum Mainnet
  await CrossChainBridgeOptimism.connect(deployer).setPeer(
    eIdSepolia,
    zeroPadValue(CrossChainBridgeEthereumAddress, 32),
  );
  console.log(
    `Bridge at address ${CrossChainBridgeArbitrumAddress} was set successfully with peer at address ${CrossChainBridgeEthereumAddress} at Ethereum`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

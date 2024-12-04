const { ethers } = require("hardhat");
import { zeroPadValue } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();

  // Fetch addresses from the checkpoint files
  const CrossChainBridgeEthereumAddress =
    "0x1E0Bd0291165F789b794e9513Eb07a76849c1448"; //TODO! Insert LZCrossChainBridgeL1 address here
  const CrossChainBridgeOptimismAddress =
    "0x19Ba5CcC603e1224B8502C56087e4147cEDD2522"; //TODO! Insert LZCrossChainBridgeL2 Optimism address here
  const CrossChainBridgeArbitrumAddress =
    "0x19Ba5CcC603e1224B8502C56087e4147cEDD2522"; //TODO! Insert LZCrossChainBridgeL2 Optimism address here

  if (
    !CrossChainBridgeEthereumAddress ||
    !CrossChainBridgeOptimismAddress ||
    !CrossChainBridgeArbitrumAddress
  ) {
    throw new Error(
      "CrossChainBridge addresses not found in the checkpoint files.",
    );
  }

  // Get contract instances
  const CrossChainBridgeSepolia = await ethers.getContractAt(
    "LZCrossChainAdapterL1",
    CrossChainBridgeEthereumAddress,
  );
  const eIDArbitrumSepolia = 30110; //Arbitrum Mainnet eID
  const eIDOptimismSepolia = 30111; //Optimism Mainnet eID

  // Set peer for OptimismSepolia
  let tx = await CrossChainBridgeSepolia.connect(deployer).setPeer(
    eIDOptimismSepolia,
    zeroPadValue(CrossChainBridgeOptimismAddress, 32),
  );
  await tx.wait();
  tx = await CrossChainBridgeSepolia.connect(deployer).setPeer(
    eIDArbitrumSepolia,
    zeroPadValue(CrossChainBridgeArbitrumAddress, 32),
  );
  await tx.wait();
  console.log("Peers set successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

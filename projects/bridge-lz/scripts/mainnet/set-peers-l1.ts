const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Fetch addresses from the checkpoint files
    const CrossChainBridgeEthereumAddress = ""; //TODO! Insert LZCrossChainBridgeL1 address here
    const CrossChainBridgeOptimismAddress = ""; //TODO! Insert LZCrossChainBridgeL2 Optimism address here
    const CrossChainBridgeArbitrumAddress = ""; //TODO! Insert LZCrossChainBridgeL2 Optimism address here

    if (!CrossChainBridgeEthereumAddress || !CrossChainBridgeOptimismAddress || !CrossChainBridgeArbitrumAddress) {
        throw new Error("CrossChainBridge addresses are not set.");
    }

    // Get contract instances
    const CrossChainBridgeSepolia = await ethers.getContractAt("LZCrossChainAdapterL1", CrossChainBridgeEthereumAddress);
    const eIDArbitrumSepolia = 30110; //Arbitrum Mainnet eID
    const eIDOptimismSepolia = 30111; //Optimism Mainnet eID

    // Set peer for OptimismSepolia
    await CrossChainBridgeSepolia.connect(deployer).setPeer(eIDOptimismSepolia, ethers.utils.zeroPad(CrossChainBridgeOptimismAddress, 32));
    await CrossChainBridgeSepolia.connect(deployer).setPeer(eIDArbitrumSepolia, ethers.utils.zeroPad(CrossChainBridgeArbitrumAddress, 32));
    console.log("Peers set successfully");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    const CrossChainBridgeEthereumAddress = "0xA2c902810eAE3C24208580e043cA0de36Ae66c3E";
    const CrossChainBridgeOptimismAddress = "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17";

    if (!CrossChainBridgeEthereumAddress || !CrossChainBridgeOptimismAddress) {
        throw new Error("CrossChainBridge addresses not found in the checkpoint files.");
    }

    // Get contract instances
    const CrossChainBridgeSepolia = await ethers.getContractAt("LZCrossChainAdapterL1", CrossChainBridgeEthereumAddress);
    const eIDOptimismSepolia = 40232; //Optimism Sepolia eID

    const tx = await CrossChainBridgeSepolia.connect(deployer).setPeer(eIDOptimismSepolia, ethers.utils.zeroPad(CrossChainBridgeEthereumAddress, 32));
    await tx.wait();
    
    console.log("Peers set successfully");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

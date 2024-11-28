const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    const CrossChainBridgeEthereumAddress = "0xA2c902810eAE3C24208580e043cA0de36Ae66c3E";
    const CrossChainBridgeOptimismAddress = "0xF634bCddFCB5F02b1E4Cd8A9057069ca24884fE2";

    if (!CrossChainBridgeEthereumAddress || !CrossChainBridgeOptimismAddress) {
        throw new Error("CrossChainBridge addresses not found in the checkpoint files.");
    }

    // Get contract instances
    const CrossChainBridgeSepolia = await ethers.getContractAt("LZCrossChainAdapterL1", CrossChainBridgeEthereumAddress);
    const eIDOptimismSepolia = 40232; //Optimism Sepolia eID

    await CrossChainBridgeSepolia.connect(deployer).setPeer(eIDOptimismSepolia, ethers.utils.zeroPad(CrossChainBridgeOptimismAddress, 32));
    console.log("Peers set successfully");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

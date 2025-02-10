const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    const CrossChainBridgeEthereumAddress = "0xA2c902810eAE3C24208580e043cA0de36Ae66c3E";
    const CrossChainBridgeArbitrumAddress = "0xb7A8CA74cbfe313804c3D52663e9b0C0585B5C4e";

    if (!CrossChainBridgeEthereumAddress || !CrossChainBridgeArbitrumAddress) {
        throw new Error("CrossChainBridge addresses not found in the checkpoint files.");
    }

    // Get contract instances
    const CrossChainBridgeSepolia = await ethers.getContractAt("LZCrossChainAdapterL1", CrossChainBridgeEthereumAddress);
    const eIDArbitrumSepolia = 40231; //Arbitrum Sepolia eID

    await CrossChainBridgeSepolia.connect(deployer).setPeer(eIDArbitrumSepolia, ethers.utils.zeroPad(CrossChainBridgeArbitrumAddress, 32));
    console.log("Peers set successfully");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

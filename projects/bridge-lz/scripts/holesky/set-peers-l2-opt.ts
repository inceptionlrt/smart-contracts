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

    // Get contract instance
    const CrossChainBridgeOptimism = await ethers.getContractAt("LZCrossChainAdapterL2", CrossChainBridgeOptimismAddress);
    const eIdSepolia = 40217; //Holesky eID

    // Set peer for Holesky
    await CrossChainBridgeOptimism.connect(deployer).setPeer(eIdSepolia, ethers.utils.zeroPad(CrossChainBridgeEthereumAddress, 32));
    console.log(`Bridge at address ${CrossChainBridgeOptimismAddress} was set successfully with peer at address ${CrossChainBridgeEthereumAddress} at Ethereum`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

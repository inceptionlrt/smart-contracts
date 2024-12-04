const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    const CrossChainBridgeEthereumAddress = ""; //TODO! Insert LZCrossChainBridgeL1 address here
    const CrossChainBridgeOptimismAddress = ""; //TODO! Insert LZCrossChainBridgeL2 Optimism address here

    if (!CrossChainBridgeEthereumAddress || !CrossChainBridgeOptimismAddress) {
        throw new Error("CrossChainBridge addresses are not set.");
    }

    // Get contract instance
    const CrossChainBridgeOptimism = await ethers.getContractAt("LZCrossChainAdapterL2", CrossChainBridgeOptimismAddress);
    const eIdSepolia = 30101; //Ethereum Mainnet eID

    // Set peer for Ethereum Mainnet
    await CrossChainBridgeOptimism.connect(deployer).setPeer(eIdSepolia, ethers.utils.zeroPad(CrossChainBridgeEthereumAddress, 32));
    console.log(`Bridge at address ${CrossChainBridgeOptimismAddress} was set successfully with peer at address ${CrossChainBridgeEthereumAddress} at Ethereum`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

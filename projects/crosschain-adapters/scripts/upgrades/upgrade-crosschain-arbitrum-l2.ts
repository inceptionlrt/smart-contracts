import { ethers, upgrades, run } from "hardhat";
import * as fs from 'fs';
require("dotenv").config();

const CHECKPOINT_FILE = "deployment_checkpoint.json";

async function main() {
    // Load checkpoint to get the deployed proxy address
    const checkpoint = loadCheckpoint();
    const proxyAddress = checkpoint.CrossChainAdapterArbitrumL2;

    if (!proxyAddress) {
        throw new Error("CrossChainAdapterArbitrumL2 proxy address not found in checkpoint.");
    }

    const [deployer] = await ethers.getSigners();
    console.log("Upgrading contract with deployer address:", deployer.address);

    // Get the contract factory for the new implementation
    const CrossChainAdapterArbitrumL2 = await ethers.getContractFactory("CrossChainAdapterArbitrumL2");

    // Upgrade the proxy to the new implementation
    console.log(`Upgrading CrossChainAdapterArbitrumL2 at proxy address: ${proxyAddress}...`);
    const upgraded = await upgrades.upgradeProxy(proxyAddress, CrossChainAdapterArbitrumL2);
    await upgraded.waitForDeployment();

    // Get the new implementation address
    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("New implementation deployed at:", newImplementationAddress);

    // Verifying on Arbiscan
    await verifyContract(newImplementationAddress);

    console.log("Upgrade and verification complete.");
}

// Verify the implementation on Arbiscan
async function verifyContract(implementationAddress: string) {
    console.log("Verifying contract on Arbiscan...");

    try {
        await run("verify:verify", {
            address: implementationAddress,
            constructorArguments: [],
        });
        console.log("Contract verified successfully!");
    } catch (error: any) {
        console.error("Error verifying contract:", error.message);
    }
}

// Load deployment checkpoint function
function loadCheckpoint(): any {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    }
    return {};
}

main().catch((error) => {
    console.error("Error in execution:", error);
    process.exitCode = 1;
});

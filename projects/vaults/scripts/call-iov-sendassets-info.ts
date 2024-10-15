import { ethers } from "hardhat";
import * as fs from 'fs';

require("dotenv").config();

const CHECKPOINT_FILE = "deployment_checkpoint.json";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    // Load checkpoint data (if it exists)
    const checkpoint = loadCheckpoint();

    // Make sure the InceptionOmniVault address exists in the checkpoint
    const inceptionOmniVaultAddress = checkpoint.InceptionOmniVault;
    if (!inceptionOmniVaultAddress) {
        throw new Error("InceptionOmniVault address not found in the checkpoint");
    }

    // Get the deployed InceptionOmniVault contract instance
    const inceptionOmniVault = await ethers.getContractAt("InceptionOmniVault", inceptionOmniVaultAddress);

    // Call the sendAssetsInfoToL1 function with empty _gasData (empty bytes array)
    const _gasData = []; // Empty bytes array
    const tx = await inceptionOmniVault.sendAssetsInfoToL1(_gasData, { value: 1n ** 16n });  // Sending 0.001 ETH in gwei units (10^16)

    console.log(`Transaction hash: ${tx.hash}`);

    // Wait for the transaction to be confirmed
    await tx.wait();
    console.log("Assets info sent to L1 successfully!");
}

// Load deployment checkpoint from file
function loadCheckpoint(): any {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    }
    throw new Error(`Checkpoint file (${CHECKPOINT_FILE}) not found.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

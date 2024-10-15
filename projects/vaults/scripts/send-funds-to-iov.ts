import { ethers } from "hardhat";
import * as fs from "fs";
require("dotenv").config();

const CHECKPOINT_FILE = "deployment_checkpoint.json";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    // Load checkpoint data to get InceptionOmniVault address
    const checkpoint = loadCheckpoint();
    const inceptionOmniVaultAddress = checkpoint.InceptionOmniVault;

    if (!inceptionOmniVaultAddress) {
        console.error("InceptionOmniVault address not found in checkpoint.");
        return;
    }

    // Get the InceptionOmniAssetsHandler contract instance (parent contract)
    const InceptionOmniAssetsHandler = await ethers.getContractFactory("InceptionOmniAssetsHandler");
    const inceptionOmniVault = InceptionOmniAssetsHandler.attach(inceptionOmniVaultAddress);

    // Call setBridge() with deployer address
    try {
        console.log(`Setting bridge to address: ${deployer.address}`);
        const tx = await inceptionOmniVault.setBridge(deployer.address);
        await tx.wait(); // Wait for the transaction to be mined
        console.log(`Bridge set successfully. Transaction Hash: ${tx.hash}`);
    } catch (error) {
        console.error(`Failed to set bridge:`, error);
        return;
    }

    // Send 0.001 ETH to InceptionOmniVault
    const amountToSend = ethers.parseEther("0.001"); // Convert to wei
    try {
        console.log(`Sending ${amountToSend.toString()} wei to InceptionOmniVault...`);
        const tx = await deployer.sendTransaction({
            to: inceptionOmniVaultAddress,
            value: amountToSend,
        });
        await tx.wait(); // Wait for the transaction to be mined
        console.log(`Successfully sent ETH to InceptionOmniVault. Transaction Hash: ${tx.hash}`);
    } catch (error) {
        console.error(`Failed to send ETH to InceptionOmniVault:`, error);
    }
}

// Load deployment checkpoint
function loadCheckpoint(): any {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf8"));
    }
    return {};
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

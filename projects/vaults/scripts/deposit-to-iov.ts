import { ethers } from "hardhat";
import axios from "axios";
import * as fs from 'fs';
import path from "path";
require("dotenv").config();



async function main() {
    const [deployer] = await ethers.getSigners();
    const jsonFilePath = path.resolve(__dirname, "../../../deployment_checkpoint_arbitrum-sepolia.json");
    console.log(`Deployer Address: ${deployer.address}`);

    if (!fs.existsSync(jsonFilePath)) {
        console.error(`Error: JSON file does not exist at path: ${jsonFilePath}`);
        process.exit(1);
    }

    const checkpoint = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

    const inceptionOmniVaultAddress = checkpoint.InceptionOmniVault;

    console.log(`inceptionOmniVaultAddress: ${inceptionOmniVaultAddress}`);

    // Create a contract instance for the InceptionOmniVault
    const inceptionOmniVaultContract = await ethers.getContractAt("InceptionOmniVault", inceptionOmniVaultAddress);


    // The amount of ETH to deposit (0.004 ETH)
    const depositAmount = ethers.parseEther("0.004"); // Convert to Wei

    // Call deposit function
    console.log(`Depositing ${depositAmount.toString()} wei to InceptionOmniVault...`);
    const depositTx = await inceptionOmniVaultContract.deposit(deployer.address, { value: depositAmount });

    // Wait for the transaction to be confirmed
    await depositTx.wait();
    console.log(`Successfully deposited ${depositAmount.toString()} wei to InceptionOmniVault at address ${inceptionOmniVaultAddress}`);
}

// Load deployment checkpoint
function loadCheckpoint(): any {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    }
    return {};
}

// Execute the script
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

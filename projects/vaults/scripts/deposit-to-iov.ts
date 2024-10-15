import { ethers } from "hardhat";
import * as fs from 'fs';

const CHECKPOINT_FILE = "deployment_checkpoint.json";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    // Load the checkpoint data to get the InceptionOmniVault, RatioFeed, and InceptionToken addresses
    const checkpoint = loadCheckpoint();
    const inceptionOmniVaultAddress = checkpoint.InceptionOmniVault;
    const ratioFeedAddress = checkpoint.RatioFeed;
    const inceptionTokenAddress = checkpoint.InceptionToken;

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

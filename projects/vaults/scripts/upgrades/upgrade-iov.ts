import { ethers, upgrades } from "hardhat";
import * as fs from 'fs';
import hre from 'hardhat'; // Import hre

const CHECKPOINT_FILE = "deployment_checkpoint.json";

async function main() {
    // Load checkpoint data (if it exists)
    const checkpoint = loadCheckpoint();
    const existingAddress = checkpoint.InceptionOmniVault;

    if (!existingAddress) {
        console.error("InceptionOmniVault address not found in checkpoint.");
        process.exit(1);
    }

    // Get the contract factory for the upgraded version
    const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");

    // Check the existing implementation address before upgrading
    const currentImplementationAddress = await upgrades.erc1967.getImplementationAddress(existingAddress);
    console.log(`Current implementation address before upgrade: ${currentImplementationAddress}`);

    // Upgrade the contract
    console.log(`Upgrading InceptionOmniVault at address: ${existingAddress}...`);
    const upgradedContract = await upgrades.upgradeProxy(existingAddress, InceptionOmniVault);

    // Wait for the upgrade to complete
    await upgradedContract.waitForDeployment();

    // Wait for the upgrade to complete (using waitForDeployment is incorrect here)
    console.log("Contract upgraded successfully");

    // Check the implementation address after upgrading
    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(existingAddress);
    console.log(`New implementation address after upgrade: ${newImplementationAddress}`);

    // Log the address of the upgraded contract
    console.log(`Successfully upgraded InceptionOmniVault. Proxy address remains: ${existingAddress}`);

    // Verify the new implementation on Etherscan
    console.log(`Verifying new implementation on Etherscan...`);
    await hre.run("verify:verify", {
        address: newImplementationAddress,
    });


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

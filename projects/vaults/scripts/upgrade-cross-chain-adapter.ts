import { ethers, upgrades } from "hardhat";
import * as fs from 'fs';

const CHECKPOINT_FILE = "deployment_checkpoint.json";

async function main() {
    // Load checkpoint data (if it exists)
    const checkpoint = loadCheckpoint();
    const existingAddress = checkpoint.CrossChainAdapterArbitrumL2;

    if (!existingAddress) {
        console.error("CrossChainAdapterArbitrumL2 address not found in checkpoint.");
        process.exit(1);
    }

    // Get the contract factory for the upgraded version
    const CrossChainAdapterArbitrumL2 = await ethers.getContractFactory("CrossChainAdapterArbitrumL2");

    // Check the existing implementation address before upgrading
    const currentImplementationAddress = await upgrades.erc1967.getImplementationAddress(existingAddress);
    console.log(`Current implementation address before upgrade: ${currentImplementationAddress}`);

    // Upgrade the contract
    console.log(`Upgrading CrossChainAdapterArbitrumL2 at address: ${existingAddress}...`);
    const upgradedContract = await upgrades.upgradeProxy(existingAddress, CrossChainAdapterArbitrumL2);

    // Wait for the upgrade to complete
    await upgradedContract.waitForDeployment();

    // Check the implementation address after upgrading
    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(existingAddress);
    console.log(`New implementation address after upgrade: ${newImplementationAddress}`);

    // Log the address of the upgraded contract
    console.log(`Successfully upgraded CrossChainAdapterArbitrumL2. Proxy address remains: ${existingAddress}`);
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

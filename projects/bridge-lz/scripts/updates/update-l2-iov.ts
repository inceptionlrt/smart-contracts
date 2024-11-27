import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();

    // Path to the JSON file
    const checkpointFilePath = path.join(__dirname, '../../deployment_checkpoint_optimism-sepolia.json');

    // Check if the file exists
    if (!fs.existsSync(checkpointFilePath)) {
        throw new Error(`File not found: ${checkpointFilePath}`);
    }

    // Read and parse the JSON file
    const checkpointData = JSON.parse(fs.readFileSync(checkpointFilePath, 'utf8'));

    // Get the CrossChainAdapterOptimismL2 address
    const crossChainAdapterL2Address: string = checkpointData.CrossChainAdapterOptimismL2;
    if (!crossChainAdapterL2Address) {
        throw new Error('Missing CrossChainAdapterOptimismL2 address in deployment_checkpoint_optimism_sepolia.json');
    }

    const inceptionOmniVaultAddress: string = checkpointData.InceptionOmniVault;
    const InceptionOmniVault = await ethers.getContractAt("IInceptionOmniVault", inceptionOmniVaultAddress);

    console.log(`Setting CrossChainAdapter on InceptionOmniVault (${inceptionOmniVaultAddress})...`);

    // Call setCrossChainAdapter with the address from the JSON file
    const tx = await InceptionOmniVault.connect(deployer).setCrossChainAdapter(crossChainAdapterL2Address);

    // Wait for the transaction to be mined
    await tx.wait();
    console.log(`CrossChainAdapter set to: ${crossChainAdapterL2Address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

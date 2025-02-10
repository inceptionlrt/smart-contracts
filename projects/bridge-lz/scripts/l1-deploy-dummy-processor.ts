import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    // Deploy the DummyDataProcessor contract
    const DummyDataProcessor = await ethers.getContractFactory("DummyDataProcessor");
    const dummyDataProcessor = await DummyDataProcessor.deploy();
    await dummyDataProcessor.deployed();

    console.log(`DummyDataProcessor deployed at: ${dummyDataProcessor.address}`);

    // Path to the JSON file
    const checkpointFilePath = path.join(__dirname, '../deployment_checkpoint_sepolia.json');

    // Check if the file exists
    if (!fs.existsSync(checkpointFilePath)) {
        throw new Error(`File not found: ${checkpointFilePath}`);
    }

    // Read the JSON file
    const checkpointData = JSON.parse(fs.readFileSync(checkpointFilePath, 'utf8'));

    // Update the JSON file with the deployed contract address
    checkpointData.DummyDataProcessor = dummyDataProcessor.address;
    fs.writeFileSync(checkpointFilePath, JSON.stringify(checkpointData, null, 2), 'utf8');

    console.log(`Updated deployment_checkpoint_sepolia.json with DummyDataProcessor: ${dummyDataProcessor.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

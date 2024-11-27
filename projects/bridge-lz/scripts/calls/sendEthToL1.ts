import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

const Options = require("@layerzerolabs/lz-v2-utilities").Options;
const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log(`deployer: ${deployer.address}`);

    // Path to the JSON file
    const checkpointFilePath = path.join(__dirname, '../../../../deployment_checkpoint_optimism-sepolia.json');

    // Check if the file exists
    if (!fs.existsSync(checkpointFilePath)) {
        throw new Error(`File not found: ${checkpointFilePath}`);
    }

    // Read and parse the JSON file
    const checkpointData = JSON.parse(fs.readFileSync(checkpointFilePath, 'utf8'));

    // Get the CrossChainAdapterOptimismL2 address
    const crossChainAdapterAddress = checkpointData.CrossChainAdapterOptimismL2;
    if (!crossChainAdapterAddress) {
        throw new Error('CrossChainAdapterOptimismL2 address not found in deployment_checkpoint_optimism-sepolia.json');
    }



    // Attach to the CrossChainAdapterOptimismL2 contract
    const CrossChainAdapterOptimismL2 = await ethers.getContractAt("CrossChainAdapterOptimismL2", crossChainAdapterAddress);

    const operator = await CrossChainAdapterOptimismL2.operator();
    console.log(`Operator Address: ${operator}`);

    // Output the vault address before the transaction
    const vaultAddress = await CrossChainAdapterOptimismL2.vault();
    console.log(`Vault Address: ${vaultAddress}`);

    // Define message and options
    const message = "1";
    const options = Options.newOptions().toHex().toString();

    console.log(`options: ${options}`);
    

    console.log(`Calling sendEthToL1 with 0.0002 ETH to contract at address ${crossChainAdapterAddress}...`);

    const destinationEid = 40161;

    try {
        // Call sendEthToL1 with 0.0002 ETH
        const tx = await CrossChainAdapterOptimismL2.sendEthToL1_2(destinationEid, message, options, {
            value: "650750093439552"
        });

        console.log("Transaction sent:", tx.hash);

        // Wait for the transaction to be mined
        await tx.wait();
        console.log("Transaction confirmed!");
    } catch (e) {
        console.error(e);
    }


}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

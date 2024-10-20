const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Path to the JSON file
    const checkpointFilePath = path.join(__dirname, '../../deployment_checkpoint_sepolia.json');

    // Check if file exists
    if (!fs.existsSync(checkpointFilePath)) {
        throw new Error(`File not found: ${checkpointFilePath}`);
    }

    // Read and parse the JSON file
    const checkpointData = JSON.parse(fs.readFileSync(checkpointFilePath, 'utf8'));

    const optimismAdapterL1Address = checkpointData.CrossChainAdapterOptimismL1;
    if (!optimismAdapterL1Address) {
        throw new Error('Missing CrossChainAdapterOptimismL1 address in deployment_checkpoint_sepolia.json');
    }

    const transactionStorageAddress = checkpointData.TransactionStorage;
    if (!transactionStorageAddress) {
        throw new Error('Missing transactionStorage address in deployment_checkpoint_sepolia.json');
    }

    // Attach to the TransactionStorage contract
    const TransactionStorage = await ethers.getContractAt("ITransactionStorage", transactionStorageAddress);

    // Output the owner of the TransactionStorage contract
    const owner = await TransactionStorage.owner();
    console.log(`Owner of the TransactionStorage contract (${transactionStorageAddress}) is: ${owner}`);
    console.log(`You're executing using: ${deployer.address}`);


    console.log(`Replacing adapter on TransactionStorage contract (${transactionStorageAddress})...`);

    // Call replaceAdapter function with chainId 10 (Optimism)
    const chainId = 10; // Optimism chain ID
    try {
        const tx = await TransactionStorage.replaceAdapter(chainId, optimismAdapterL1Address);
        await tx.wait();
        console.log(`Adapter replaced successfully for chainId ${chainId} with address ${optimismAdapterL1Address}`);
    } catch (error) {
        console.error("Transaction failed: ", error);
    }


}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

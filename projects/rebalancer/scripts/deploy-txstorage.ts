import { ethers } from "hardhat";

async function main() {
    // Get the deployer's address
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();

    console.log("Deploying TransactionStorage contract...");

    // Get the contract factory for TransactionStorage
    const TransactionStorageFactory = await ethers.getContractFactory("TransactionStorage");

    // Deploy the TransactionStorage contract with the deployer as the owner
    const transactionStorage = await TransactionStorageFactory.deploy(deployerAddress);

    // Wait for the contract deployment to complete
    await transactionStorage.waitForDeployment();

    // Retrieve the deployed contract address
    const transactionStorageAddress = await transactionStorage.getAddress();

    console.log("TransactionStorage deployed at:", transactionStorageAddress);

    // Optional: Adding a Chain ID (example: Arbitrum Chain ID 42161)
    const chainId = 42161;
    const tx = await transactionStorage.addChainId(chainId);
    await tx.wait();

    console.log(`Chain ID ${chainId} added successfully.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const operatorAddress = process.env.OPERATOR_ADDRESS;
    const tokenAddress = process.env.TOKEN_ADDRESS;

    if (!operatorAddress || !tokenAddress) {
        console.error("Error: Please set both OPERATOR_ADDRESS and TOKEN_ADDRESS in your environment variables.");
        process.exit(1);
    }

    const [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);

    const initialBalance = await ethers.provider.getBalance(deployer.address);

    // Deploy the InceptionAirdrop contract
    const InceptionAirdropFactory = await ethers.getContractFactory("InceptionAirdrop");
    const inceptionAirdrop = await InceptionAirdropFactory.deploy();
    await inceptionAirdrop.waitForDeployment();
    console.log(`InceptionAirdrop deployed at: ${await inceptionAirdrop.getAddress()}`);

    // Initialize the contract with owner, operator and token
    const tx = await inceptionAirdrop.initialize(deployer.address, operatorAddress, tokenAddress);
    await tx.wait();
    console.log(`InceptionAirdrop initialized with owner: ${deployer.address}, operator: ${operatorAddress}, token: ${tokenAddress}`);

    // Fetch the final balance of the deployer using native BigInt
    const finalBalance = await ethers.provider.getBalance(deployer.address);

    // Calculate and log the deployment cost in ETH
    const deploymentCost = initialBalance - finalBalance;
    console.log(`Deployment cost: ${ethers.formatEther(deploymentCost)} ETH`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

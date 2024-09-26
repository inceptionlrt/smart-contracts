require("dotenv").config();
import { ethers, network } from "hardhat";

async function main() {
    const networkName = network.name;
    console.log(`Deploying L2Receiver on network: ${networkName}`);

    // Set the correct RPC URL based on the target network
    let rpcUrlEthereum = process.env.RPC_URL_SEPOLIA;

    // Check for environment variables
    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!deployerPrivateKey || !rpcUrlEthereum) {
        throw new Error("Missing environment variables");
    }

    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrlEthereum);
    const wallet = new ethers.Wallet(deployerPrivateKey, provider);

    // Deploy the contract
    const ReceiverFactory = await ethers.getContractFactory("L2Receiver", wallet);
    console.log("Deploying the L2Receiver contract...");

    const receiverContract = await ReceiverFactory.deploy();
    await receiverContract.waitForDeployment();

    // Output the deployed contract address
    const receiverAddress = await receiverContract.getAddress();
    console.log("L2Receiver contract deployed at:", receiverAddress);
}

main().catch((error) => {
    console.error("Error deploying the contract:", error);
    process.exitCode = 1;
});

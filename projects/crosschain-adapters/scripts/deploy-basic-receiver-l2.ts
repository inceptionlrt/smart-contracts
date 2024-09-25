require("dotenv").config();
import { ethers } from "hardhat";

async function main() {
    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    const rpcUrlArbitrumSepolia = process.env.RPC_URL_ARBITRUM_SEPOLIA;

    if (!deployerPrivateKey || !rpcUrlArbitrumSepolia) {
        throw new Error("Missing environment variables");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrlArbitrumSepolia);
    const wallet = new ethers.Wallet(deployerPrivateKey, provider);

    // Get the contract factory and deploy the contract
    const ReceiverFactory = await ethers.getContractFactory("L2Receiver", wallet);
    console.log("Deploying the L2Receiver contract...");

    const receiverContract = await ReceiverFactory.deploy();

    await receiverContract.waitForDeployment();

    // Get the contract address
    const receiverAddress = await receiverContract.getAddress();
    console.log("L2Receiver contract deployed at:", receiverAddress);
}

main().catch((error) => {
    console.error("Error deploying the contract:", error);
    process.exitCode = 1;
});

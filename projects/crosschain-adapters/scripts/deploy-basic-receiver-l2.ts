require("dotenv").config();
import { ethers, network } from "hardhat";

async function main() {

    const networkName = network.name;
    console.log(`Deploying BasicReceiver on network: ${networkName}`);

    let rpcUrlArbitrum;
    if (networkName === "sepolia") {
        rpcUrlArbitrum = process.env.RPC_URL_ARBITRUM_SEPOLIA;
    } else if (networkName === "ethereum") {
        rpcUrlArbitrum = process.env.RPC_URL_ARBITRUM;
    } else {
        console.error("Unsupported chain.");
        process.exit(1);
    }

    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!deployerPrivateKey || !rpcUrlArbitrum) {
        throw new Error("Missing environment variables");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrlArbitrum);
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

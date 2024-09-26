require("dotenv").config();
import { ethers, network } from "hardhat";

async function main() {
    const networkName = network.name;
    console.log(`Deploying BasicReceiver on network: ${networkName}`);

    let rpcUrlOptimism;
    if (networkName === "optimismSepolia") {
        rpcUrlOptimism = process.env.RPC_URL_OPTIMISM_SEPOLIA;
    } else if (networkName === "optimism") {
        rpcUrlOptimism = process.env.RPC_URL_OPTIMISM_SEPOLIA;
    } else {
        console.error("Unsupported chain. Use Optimism Sepolia or Mainnet.");
        process.exit(1);
    }

    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!deployerPrivateKey || !rpcUrlOptimism) {
        throw new Error("Missing environment variables");
    }

    // Create a provider for the specified Optimism network
    const provider = new ethers.JsonRpcProvider(rpcUrlOptimism);
    const wallet = new ethers.Wallet(deployerPrivateKey, provider);

    // Get the contract factory and deploy the contract
    const ReceiverFactory = await ethers.getContractFactory("OptimismReceiver", wallet);
    console.log("Deploying the OptimismReceiver contract...");

    const receiverContract = await ReceiverFactory.deploy();

    await receiverContract.waitForDeployment();

    // Get the contract address
    const receiverAddress = await receiverContract.getAddress();
    console.log("OptimismReceiver contract deployed at:", receiverAddress);
}

main().catch((error) => {
    console.error("Error deploying the contract:", error);
    process.exitCode = 1;
});

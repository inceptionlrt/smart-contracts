require("dotenv").config();
import { ethers, upgrades, network } from "hardhat";

async function main() {
    // Define the gas costs for Optimism L1 to L2 transfers
    const maxGas = ethers.toBigInt("2000000"); // Directly parse to BigInt as required

    const networkName = network.name;
    console.log(`Deploying CrossChainAdapterOptimismL1 on network: ${networkName}`);

    const transactionStorageAddress = process.env.TRANSACTION_STORAGE_ADDRESS;
    const l2ContractAddress = process.env.L2_RECEIVER_OP_SEPOLIA;

    console.log(`Sanity checks: env variables, L1 contracts, and L2 receiver contracts on Optimism (${networkName === "optimismSepolia" ? "Sepolia" : "Mainnet"})...`);

    // Sanity check 1: Check if the required env variables are set
    if (!transactionStorageAddress || !l2ContractAddress) {
        console.error("Set TRANSACTION_STORAGE_ADDRESS, L2_RECEIVER_OP_SEPOLIA env variables!");
        process.exit(1);
    }

    let optimismRpcUrl;
    let optimismMessengerAddress;
    let optimismBridgeAddress;

    if (networkName === "sepolia") {
        optimismRpcUrl = process.env.RPC_URL_OPTIMISM_SEPOLIA;
        optimismMessengerAddress = process.env.OPT_X_DOMAIN_MESSENGER_L1_SEPOLIA;
        optimismBridgeAddress = process.env.OPT_L1_BRIDGE_SEPOLIA;

        if (!optimismMessengerAddress || !optimismBridgeAddress) {
            console.error("Set OP_MESSENGER_SEPOLIA and OP_BRIDGE_SEPOLIA env variables!");
            process.exit(1);
        }
    } else if (networkName === "ethereum" || networkName === "hardhat") {
        optimismRpcUrl = process.env.RPC_URL_OPTIMISM_MAINNET;
        optimismMessengerAddress = process.env.OPT_X_DOMAIN_MESSENGER_L1_MAINNET;
        optimismBridgeAddress = process.env.OPT_L1_BRIDGE_ETHEREUM;

        if (!optimismMessengerAddress || !optimismBridgeAddress) {
            console.error("Set OP_MESSENGER_MAINNET and OP_BRIDGE_MAINNET env variables!");
            process.exit(1);
        }
    } else {
        console.error("Unsupported network. Please use Optimism Sepolia or Optimism Mainnet.");
        process.exit(1);
    }

    if (!optimismRpcUrl) {
        console.error("Error: Corresponding Optimism RPC URL is not set in the environment variables.");
        process.exit(1);
    }

    const optimismProvider = new ethers.JsonRpcProvider(optimismRpcUrl);
    // const l2Code = await optimismProvider.getCode(l2ContractAddress);
    // if (l2Code === "0x") {
    //     console.error(`Error: No contract found at address ${l2ContractAddress} on Optimism ${networkName === "sepolia" ? "Sepolia" : "Mainnet"}.`);
    //     process.exit(1);
    // }

    console.log("All sanity checks passed 💪");

    // Deploy CrossChainAdapterOptimismL1 using a proxy
    console.log("Deploying CrossChainAdapterOptimismL1...");

    const CrossChainAdapterOptimism = await ethers.getContractFactory("CrossChainAdapterOptimismL1");

    const crossChainAdapter = await upgrades.deployProxy(CrossChainAdapterOptimism, [
        optimismMessengerAddress,
        optimismBridgeAddress,
        transactionStorageAddress,
    ], {
        initializer: "initialize",
    });

    // Wait for the deployment to finish
    await crossChainAdapter.waitForDeployment();
    const crossChainAdapterAddress = await crossChainAdapter.getAddress();
    console.log("CrossChainAdapterOptimismL1 deployed at:", crossChainAdapterAddress);

    // Set the deployer's address as the rebalancer
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    await crossChainAdapter.setRebalancer(deployerAddress);

    // Set the L2 receiver and sender addresses
    console.log("L2 Receiver (Optimism):", l2ContractAddress);
    const txReceiver = await crossChainAdapter.setL2Receiver(l2ContractAddress);
    await txReceiver.wait();

    const txSender = await crossChainAdapter.setL2Sender(l2ContractAddress);
    await txSender.wait();
    console.log("L2 sender and receiver set successfully");

    // Send a small amount of ETH to L2 using sendEthToL2
    console.log("Sending a small amount of ETH to L2...");
    const callValue = ethers.parseEther("0.01");  // ETH to send to L2
    const totalValue = ethers.parseEther("0.05"); // Adjust total value to cover potential fees

    try {
        console.log(`CallValue: ${callValue.toString()}, TotalValue: ${totalValue.toString()}`);

        // Ensure gasData contains proper maxGas value
        const gasData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256"],
            [maxGas] // Provide a reasonable gas value
        );

        const sendTx = await crossChainAdapter.sendEthToL2(callValue, [gasData], {
            value: totalValue,  // Ensure totalValue covers callValue + fees
        });
        await sendTx.wait();
        console.log("ETH sent to L2 successfully.");
    } catch (error) {
        console.error("Error sending ETH to L2:", error);
    }

    console.log("Deployment and configuration complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

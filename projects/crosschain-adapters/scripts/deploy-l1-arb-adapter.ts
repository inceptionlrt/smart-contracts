require("dotenv").config();
import { ethers, upgrades, network } from "hardhat";

// Gas costs can be unpredictable, so play around with gas settings
async function main() {
    const maxSubmissionCost = ethers.parseEther("0.02");
    const maxGas = ethers.toBigInt("2000000");
    const gasPriceBid = ethers.parseUnits("3", "gwei");

    const networkName = network.name;
    console.log(`Deploying CrossChainAdapterArbitrum on network: ${networkName}`);

    const transactionStorageAddress = process.env.TRANSACTION_STORAGE_ADDRESS;
    const l2Receiver = process.env.L2_RECEIVER;
    const l2Sender = process.env.L2_SENDER;

    console.log(`Sanity checks: env variables, L1 contracts, L2 receiver contracts on Arbitrum (${networkName === "sepolia" ? "Sepolia" : "Mainnet"})...`);

    // Sanity check 1: Ensure env variables are set
    if (!transactionStorageAddress || !l2Receiver || !l2Sender) {
        console.error("Set TRANSACTION_STORAGE_ADDRESS, L2_SENDER, L2_RECEIVER env variables!");
        process.exit(1);
    }

    // Sanity check 2: Ensure L2 receiver contract existence
    let arbitrumRpcUrl;
    let arbitrumInboxAddress;
    if (networkName === "sepolia") {
        arbitrumRpcUrl = process.env.RPC_URL_ARBITRUM_SEPOLIA;
        arbitrumInboxAddress = process.env.ARB_INBOX_SEPOLIA;
        if (!arbitrumInboxAddress) {
            console.error("Set ARB_INBOX_SEPOLIA env variable!");
            process.exit(1);
        }
    } else if (networkName === "ethereum" || networkName === "hardhat") {
        arbitrumRpcUrl = process.env.RPC_URL_ARBITRUM;
        arbitrumInboxAddress = process.env.ARB_INBOX_MAINNET;
        if (!arbitrumInboxAddress) {
            console.error("Set ARB_INBOX_MAINNET env variable!");
            process.exit(1);
        }
    } else {
        console.error("Unsupported network. Please use Sepolia or Ethereum (Mainnet).");
        process.exit(1);
    }

    if (!arbitrumRpcUrl) {
        console.error("Error: Corresponding Arbitrum RPC URL is not set in the environment variables.");
        process.exit(1);
    }

    const arbitrumProvider = new ethers.JsonRpcProvider(arbitrumRpcUrl);
    const l2Code = await arbitrumProvider.getCode(l2Receiver);
    if (l2Code === "0x") {
        console.error(`Error: No contract found at address ${l2Receiver} on Arbitrum ${networkName === "sepolia" ? "Sepolia" : "Ethereum"}.`);
        process.exit(1);
    }

    console.log("All sanity checks passed 💪");

    console.log("Deploying CrossChainAdapterArbitrumL1...");
    const CrossChainAdapterArbitrum = await ethers.getContractFactory("CrossChainAdapterArbitrumL1");
    const crossChainAdapter = await upgrades.deployProxy(CrossChainAdapterArbitrum, [transactionStorageAddress, arbitrumInboxAddress], {
        initializer: "initialize",
    });

    console.log("CrossChainAdapterArbitrumL1 deployed at:", await crossChainAdapter.getAddress());

    // Set the deployer's address as the rebalancer
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    await crossChainAdapter.setRebalancer(deployerAddress);

    console.log("Rebalancer set to deployer's address:", deployerAddress);

    // Set L2 receiver and sender
    await crossChainAdapter.setL2Receiver(l2Receiver);
    await crossChainAdapter.setL2Sender(l2Sender);
    console.log("L2 sender and receiver set successfully");

    // Send a small amount of ETH to L2 using the updated sendEthToL2 function
    console.log("Sending a small amount of ETH to L2...");
    const callValue = ethers.parseEther("0.01");  // The ETH to send
    const totalValue = ethers.parseEther("0.05"); // Total msg.value (callValue + fees)

    // Encode gas parameters for Arbitrum as bytes[]
    const gasData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [maxSubmissionCost, maxGas, gasPriceBid]
    );

    try {
        console.log(`CallValue: ${callValue.toString()}, TotalValue: ${totalValue.toString()}`);
        const sendTx = await crossChainAdapter.sendEthToL2(callValue, [gasData], {
            value: totalValue, // msg.value includes callValue + fees
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
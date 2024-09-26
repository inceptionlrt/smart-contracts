require("dotenv").config();
import { ethers, network } from "hardhat";

// Gas costs can be unpredictable, so play around with gas settings
async function main() {
    // Use the correct ethers API for parsing units
    const maxSubmissionCost = ethers.parseEther("0.02");
    const maxGas = ethers.toBigInt("2000000"); // Parse directly to BigInt as required
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

    // Sanity check 2: Ensure L1 contract existence
    const code = await ethers.provider.getCode(transactionStorageAddress);
    if (code === "0x") {
        console.error(`Error: TransactionStorage not found at address ${transactionStorageAddress} on the network ${network.name}.`);
        process.exit(1);
    }

    // Sanity check 3: Ensure L2 receiver contract existence
    let arbitrumRpcUrl;
    let arbitrumInboxAddress;
    if (networkName === "sepolia") {
        arbitrumRpcUrl = process.env.RPC_URL_ARBITRUM_SEPOLIA;
        arbitrumInboxAddress = process.env.ARB_INBOX_SEPOLIA;
        if (!arbitrumInboxAddress) {
            console.error("Set ARB_INBOX_SEPOLIA env variable!");
            process.exit(1);
        }
    } else if (networkName === "ethereum") {
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

    // Deploy the CrossChainAdapterArbitrumL1 contract
    console.log("Deploying CrossChainAdapterArbitrumL1...");
    const CrossChainAdapterArbitrum = await ethers.getContractFactory("CrossChainAdapterArbitrumL1");
    const crossChainAdapter = await CrossChainAdapterArbitrum.deploy(transactionStorageAddress);
    await crossChainAdapter.waitForDeployment();
    const crossChainAdapterAddress = await crossChainAdapter.getAddress();
    console.log("CrossChainAdapterArbitrum deployed at:", crossChainAdapterAddress);

    // Set the inbox address for Arbitrum communication
    console.log("Setting inbox address...");
    const setInboxTx = await crossChainAdapter.setInbox(arbitrumInboxAddress);
    await setInboxTx.wait();
    console.log("Inbox address set successfully");

    console.log("L2 receiver:", l2Receiver);

    const txReceiver = await crossChainAdapter.setL2Receiver(l2Receiver);
    await txReceiver.wait();
    const txSender = await crossChainAdapter.setL2Sender(l2Sender);
    await txSender.wait();
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

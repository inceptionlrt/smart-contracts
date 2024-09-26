require("dotenv").config();
import { ethers, network } from "hardhat";

//Gas costs can be unpredictable, so play around with Gas settings
async function main() {

    //IMPORTANT! Gas costs can be unpredictable, so play around with Gas settings
    const maxSubmissionCost = ethers.parseUnits("0.02", "ether");
    const maxGas = ethers.parseUnits("2000000", "wei");
    const gasPriceBid = ethers.parseUnits("3", "gwei");

    const networkName = network.name;
    console.log(`Deploying CrossChainAdapterArbitrum on network: ${networkName}`);

    const transactionStorageAddress = process.env.TRANSACTION_STORAGE_ADDRESS;
    const l2Receiver = process.env.L2_RECEIVER;
    const l2Sender = process.env.L2_SENDER;

    console.log(`Sanity checks: env variables, l1 contracts, l2 receiver contracts on Arbitrum (${networkName === "sepolia" ? "Sepolia" : "Mainnet"})...`);

    //Sanity check 1: env variables
    if (!transactionStorageAddress || !l2Receiver || !l2Sender) {
        console.error("Set TRANSACTION_STORAGE_ADDRESS, L2_SENDER, L2_RECEIVER env variables!");
        process.exit(1);
    }

    //Sanity check 2: supporting L1 contracts existence
    const code = await ethers.provider.getCode(transactionStorageAddress);
    if (code === "0x") {
        console.error(`Error: TransactionStorage not found at address ${transactionStorageAddress} on the network ${network.name}.`);
        process.exit(1);
    }

    //Sanity check 3: receiver L2 contract existence
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
    //end of sanity checks

    console.log("Deploying CrossChainAdapterArbitrumL1...");

    const CrossChainAdapterArbitrum = await ethers.getContractFactory(
        "CrossChainAdapterArbitrumL1"
    );

    const crossChainAdapter = await CrossChainAdapterArbitrum.deploy(
        transactionStorageAddress
    );

    await crossChainAdapter.waitForDeployment();
    const crossChainAdapterAddress = await crossChainAdapter.getAddress();
    console.log("CrossChainAdapterArbitrum deployed at:", crossChainAdapterAddress);

    // Set the inbox address for Arbitrum communication
    console.log("Setting inbox address...");
    const setInboxTx = await crossChainAdapter.setInbox(arbitrumInboxAddress);
    await setInboxTx.wait();
    console.log("Inbox address set successfully");

    const gasTx = await crossChainAdapter.setGasParameters(
        maxSubmissionCost,
        maxGas,
        gasPriceBid
    );
    await gasTx.wait();
    console.log("Gas parameters set successfully");

    console.log("L2 receiver:", l2Receiver);

    const txReceiver = await crossChainAdapter.setL2Receiver(l2Receiver);
    txReceiver.wait();
    const txSender = await crossChainAdapter.setL2Sender(l2Sender);
    txSender.wait();
    console.log("L2 sender and receiver set successfully");

    // uncomment lines below if you just want to deploy the AbstractCrossChainAdapter without cross-chain txs
    // console.error("Bye, bye!");
    // process.exit();

    // Send a small amount of ETH to L2 using sendEthToL2
    console.log("Sending a small amount of ETH to L2...");
    const callValue = ethers.parseUnits("0.01", "ether"); // The ETH to send
    const totalValue = ethers.parseUnits("0.05", "ether"); // Total msg.value (callValue + fees)

    try {
        console.log(`CallValue: ${callValue.toString()}, TotalValue: ${totalValue.toString()}`);
        const sendTx = await crossChainAdapter.sendEthToL2(callValue, {
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

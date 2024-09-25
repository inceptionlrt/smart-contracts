require("dotenv").config();
import { ethers } from "hardhat";

async function main() {
    const transactionStorageAddress = `${process.env.TRANSACTION_STORAGE_ADDRESS}`;
    const inboxAddress = `0xaAe29B0366299461418F5324a79Afc425BE5ae21`; // Correct Arbitrum Sepolia Inbox

    console.log("Deploying CrossChainAdapterArbitrum...");

    const CrossChainAdapterArbitrum = await ethers.getContractFactory(
        "CrossChainAdapterArbitrum"
    );

    const crossChainAdapter = await CrossChainAdapterArbitrum.deploy(
        transactionStorageAddress
    );

    await crossChainAdapter.waitForDeployment();
    const crossChainAdapterAddress = await crossChainAdapter.getAddress();
    console.log("CrossChainAdapterArbitrum deployed at:", crossChainAdapterAddress);

    // Set the inbox address for Arbitrum communication
    console.log("Setting inbox address...");
    const setInboxTx = await crossChainAdapter.setInbox(inboxAddress);
    await setInboxTx.wait();
    console.log("Inbox address set successfully");

    // Set the initial gas parameters
    const maxSubmissionCost = ethers.parseUnits("0.02", "ether");
    const maxGas = ethers.parseUnits("2000000", "wei");
    const gasPriceBid = ethers.parseUnits("3", "gwei");

    const gasTx = await crossChainAdapter.setGasParameters(
        maxSubmissionCost,
        maxGas,
        gasPriceBid
    );
    await gasTx.wait();
    console.log("Gas parameters set successfully");

    const l2Target = `${process.env.L2TARGET}`;
    const l2Sender = `${process.env.L2SENDER}`;

    console.log("L2 Target:", l2Target);
    console.log("L2 Sender:", l2Sender);

    await crossChainAdapter.setL2Target(l2Target);
    console.log("L2 Target set successfully");

    await crossChainAdapter.setL2Sender(l2Sender);
    console.log("L2 Sender set successfully");

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

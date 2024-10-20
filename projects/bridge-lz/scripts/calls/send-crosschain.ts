import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    // Load the checkpoint data to get the LZCrossChainBridge contract address
    const checkpointFilePath = path.join(__dirname, "../../../../deployment_checkpoint_optimism-sepolia.json");

    // Ensure the deployment checkpoint file exists
    if (!fs.existsSync(checkpointFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointFilePath}`);
    }

    // Read the deployment checkpoint data
    const checkpointData = JSON.parse(fs.readFileSync(checkpointFilePath, "utf8"));

    // Retrieve the LZCrossChainBridge address
    const lzCrossChainBridgeAddress = checkpointData.LZCrossChainBridge;
    if (!lzCrossChainBridgeAddress) {
        throw new Error('LZCrossChainBridge address not found in deployment_checkpoint_optimism-sepolia.json');
    }

    // Get the LZCrossChainBridge contract instance
    const LZCrossChainBridge = await ethers.getContractAt("ICrossChainBridge", lzCrossChainBridgeAddress);

    // Prepare parameters for the sendCrosschain call
    const destinationChainId = 40161;
    const payload = "0x"; // Empty data
    const options = "0x"; // Empty options
    const ethToSend = ethers.parseUnits("0.002", "ether"); // Sending 0.002 ETH

    // Step 1: Call .quote() to get the fee estimate and extract MessagingFee.nativeFee
    console.log(`Calling .quote() to get fee estimate for the crosschain transaction...`);
    const feeEstimate = await LZCrossChainBridge.quote(destinationChainId, payload, options, false);
    const nativeFee = ethers.toBigInt(feeEstimate); // Cast the result as BigInt
    console.log(`Estimated fee: ${ethers.formatEther(nativeFee)} ETH`);

    // Step 2: Add ethToSend to the fee estimate
    const totalValueToSend = nativeFee + ethToSend;
    console.log(`Total ETH to send (fee + value): ${ethers.formatEther(totalValueToSend)} ETH`);

    // Step 3: Call sendCrosschain with the calculated total value
    console.log(`Calling sendCrosschain() on LZCrossChainBridge at: ${lzCrossChainBridgeAddress}`);
    const tx = await LZCrossChainBridge.sendCrosschain(destinationChainId, payload, options, { value: totalValueToSend });
    await tx.wait();

    console.log(`sendCrosschain() successfully called. Tx hash: ${tx.hash}`);
}

// Run the script
main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});

// scripts/sendEthCrossChain.js
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Options } from "@layerzerolabs/lz-v2-utilities";

// Define options for LayerZero cross-chain transaction
const options = Options.newOptions().addExecutorLzReceiveOption(200000, 1000).toHex().toString();

async function main() {
    // Define the path to the deployment checkpoint file and load it
    const checkpointPath = path.join(__dirname, '../../../../deployment_checkpoint_optimism-sepolia.json');
    if (!fs.existsSync(checkpointPath)) {
        console.error("Checkpoint file deployment_checkpoint_optimism-sepolia.json not found!");
        process.exit(1);
    }

    // Retrieve the LZCrossChainAdapterL2 address from the checkpoint file
    const checkpointData = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
    const lzCrossChainAdapterL2Address = checkpointData.LZCrossChainAdapterL2;
    if (!lzCrossChainAdapterL2Address) {
        console.error("LZCrossChainAdapterL2 address not found in deployment_checkpoint_optimism-sepolia.json!");
        process.exit(1);
    }

    // Define ABI with sendEthCrossChain function signature
    const abi = [
        "function sendEthCrossChain(uint256 _chainId, bytes _options) external payable"
    ];

    // Attach to the contract and connect the signer
    const signer = await ethers.provider.getSigner();
    const LZCrossChainAdapterL2 = new ethers.Contract(lzCrossChainAdapterL2Address, abi, signer);
    console.log("Attached to LZCrossChainAdapterL2 at address:", lzCrossChainAdapterL2Address);

    // Define the destination chain ID
    const destinationChainId = 11155111;  // replace with actual destination chain ID

    // Call sendEthCrossChain with the desired ETH amount and options
    const tx = await LZCrossChainAdapterL2.sendEthCrossChain(destinationChainId, options, {
        value: ethers.parseEther("0.1") // Adjust ETH amount as needed
    });

    console.log("Sending ETH across chain...");
    await tx.wait();
    console.log("sendEthCrossChain transaction complete:", tx.hash);
}

// Execute the main function
main().catch((error) => {
    console.error(error);
    process.exit(1);
});

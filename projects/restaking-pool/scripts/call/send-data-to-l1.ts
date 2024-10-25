import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Options } from "@layerzerolabs/lz-v2-utilities";

const options = Options.newOptions().addExecutorLzReceiveOption(800000, 0).toHex().toString();

async function main() {
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

    // Define ABI with sendDataL1 function signature
    const abi = [
        "function sendDataL1(bytes _payload, bytes _options) external payable"
    ];

    // Attach to the contract and connect the signer
    const signer = await ethers.provider.getSigner();
    const LZCrossChainAdapterL2 = new ethers.Contract(lzCrossChainAdapterL2Address, abi, signer);
    console.log("Attached to LZCrossChainAdapterL2 at address:", lzCrossChainAdapterL2Address);

    const timestamp = Math.floor(Date.now() / 1000) - 1000; // current timestamp in seconds
    const balance = ethers.parseEther("1.5");
    const totalSupply = ethers.parseEther("1000");

    const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [timestamp, balance, totalSupply]
    );

    const tx = await LZCrossChainAdapterL2.sendDataL1(payload, options, {
        value: ethers.parseEther("0.1")
    });

    console.log("Sending data across chain...");
    await tx.wait();
    console.log("sendDataL1 transaction complete:", tx.hash);
}

// Execute the main function
main().catch((error) => {
    console.error(error);
    process.exit(1);
});

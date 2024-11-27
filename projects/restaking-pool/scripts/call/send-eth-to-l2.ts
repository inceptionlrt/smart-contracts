import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Options } from "@layerzerolabs/lz-v2-utilities";

const options = Options.newOptions().addExecutorLzReceiveOption(200000, 334000).toHex().toString();

async function main() {
    const checkpointPath = path.join(__dirname, '../../../../deployment_checkpoint_sepolia.json');
    if (!fs.existsSync(checkpointPath)) {
        console.error("Checkpoint file deployment_checkpoint_sepolia not found!");
        process.exit(1);
    }

    const checkpointData = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
    const lzCrossChainAdapterL1Address = checkpointData.LZCrossChainAdapterL1;
    if (!lzCrossChainAdapterL1Address) {
        console.error("LZCrossChainAdapterL1 address not found in deployment_checkpoint_sepolia!");
        process.exit(1);
    }

    const abi = [
        "function sendEthCrossChain(uint256 _chainId, bytes _options) external payable"
    ];

    // Attach to the contract and connect the signer
    const signer = await ethers.provider.getSigner();
    const LZCrossChainAdapterL1 = new ethers.Contract(lzCrossChainAdapterL1Address, abi, signer);
    console.log("Attached to LZCrossChainAdapterL1 at address:", lzCrossChainAdapterL1Address);

    const destinationChainId = 11155420; //chain id of Optimism Sepolia

    const tx = await LZCrossChainAdapterL1.sendEthCrossChain(destinationChainId, options, {
        value: ethers.parseEther("0.1")
    });

    console.log("Sending ETH to Optimism Sepolia...");
    await tx.wait();
    console.log("sendEthCrossChain transaction complete:", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
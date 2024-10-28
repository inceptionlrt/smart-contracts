import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Options } from "@layerzerolabs/lz-v2-utilities";

const options = Options.newOptions().addExecutorLzReceiveOption(200000, 300000).toHex().toString();

async function main() {
    const checkpointPath = path.join(__dirname, '../../../../deployment_checkpoint_arbitrum-sepolia.json');
    if (!fs.existsSync(checkpointPath)) {
        console.error("Checkpoint file deployment_checkpoint_abritrum-sepolia.json not found!");
        process.exit(1);
    }

    const checkpointData = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
    const lzCrossChainAdapterL2Address = checkpointData.LZCrossChainAdapterL2;
    if (!lzCrossChainAdapterL2Address) {
        console.error("LZCrossChainAdapterL2 address not found in deployment_checkpoint_abritrum-sepolia.json!");
        process.exit(1);
    }

    const abi = [
        "function sendEthCrossChain(uint256 _chainId, bytes _options) external payable"
    ];

    const signer = await ethers.provider.getSigner();
    const LZCrossChainAdapterL2 = new ethers.Contract(lzCrossChainAdapterL2Address, abi, signer);
    console.log("Attached to LZCrossChainAdapterL2 at address:", lzCrossChainAdapterL2Address);

    const destinationChainId = 11155111;  //chain id of Sepolia

    const tx = await LZCrossChainAdapterL2.sendEthCrossChain(destinationChainId, options, {
        value: ethers.parseEther("0.1")
    });

    console.log("Sending ETH across chain...");
    await tx.wait();
    console.log("sendEthCrossChain transaction complete:", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

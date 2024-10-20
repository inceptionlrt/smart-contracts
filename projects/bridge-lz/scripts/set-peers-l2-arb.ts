const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Paths to the checkpoint files
    const checkpointSepoliaFilePath = path.join(__dirname, '../../../deployment_checkpoint_sepolia.json');
    const checkpointArbitrumFilePath = path.join(__dirname, '../../../deployment_checkpoint_arbitrum-sepolia.json');

    // Check if checkpoint files exist
    if (!fs.existsSync(checkpointSepoliaFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointSepoliaFilePath}`);
    }
    if (!fs.existsSync(checkpointArbitrumFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointArbitrumFilePath}`);
    }

    // Read and parse the JSON files
    const checkpointDataSepolia = JSON.parse(fs.readFileSync(checkpointSepoliaFilePath, 'utf8'));
    const checkpointDataArbitrum = JSON.parse(fs.readFileSync(checkpointArbitrumFilePath, 'utf8'));

    // Fetch addresses from the checkpoint files
    const LZCrossChainBridgeSepoliaAddress = checkpointDataSepolia.LZCrossChainBridge;
    const LZCrossChainBridgeArbitrumSepoliaAddress = checkpointDataArbitrum.LZCrossChainBridge;

    if (!LZCrossChainBridgeSepoliaAddress || !LZCrossChainBridgeArbitrumSepoliaAddress) {
        throw new Error("LZCrossChainBridge addresses not found in the checkpoint files.");
    }

    // Get contract instances
    const LZCrossChainBridgeSepolia = await ethers.getContractAt("LZCrossChainBridge", LZCrossChainBridgeArbitrumSepoliaAddress);
    const eIdSepolia = 40161; // Endpoint ID for Sepolia

    // Set peer for Sepolia
    await LZCrossChainBridgeSepolia.connect(deployer).setPeer(eIdSepolia, ethers.utils.zeroPad(LZCrossChainBridgeSepoliaAddress, 32));
    console.log("Peers set successfully");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Paths to the checkpoint files
    const checkpointSepoliaFilePath = path.join(__dirname, '../../../deployment_checkpoint_sepolia.json');
    const checkpointOptimismFilePath = path.join(__dirname, '../../../deployment_checkpoint_optimism-sepolia.json');
    const checkpointArbitrumFilePath = path.join(__dirname, '../../../deployment_checkpoint_arbitrum-sepolia.json');

    // Check if checkpoint files exist
    if (!fs.existsSync(checkpointSepoliaFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointSepoliaFilePath}`);
    }
    if (!fs.existsSync(checkpointOptimismFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointOptimismFilePath}`);
    }
    if (!fs.existsSync(checkpointArbitrumFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointArbitrumFilePath}`);
    }

    // Read and parse the JSON files
    const checkpointDataSepolia = JSON.parse(fs.readFileSync(checkpointSepoliaFilePath, 'utf8'));
    const checkpointDataOptimism = JSON.parse(fs.readFileSync(checkpointOptimismFilePath, 'utf8'));
    const checkpointDataArbitrum = JSON.parse(fs.readFileSync(checkpointArbitrumFilePath, 'utf8'));

    // Fetch addresses from the checkpoint files
    const CrossChainBridgeSepoliaAddress = checkpointDataSepolia.CrossChainBridge;
    const CrossChainBridgeOptimismSepoliaAddress = checkpointDataOptimism.CrossChainBridge;
    const CrossChainBridgeArbitrumSepoliaAddress = checkpointDataArbitrum.CrossChainBridge;

    if (!CrossChainBridgeSepoliaAddress || !CrossChainBridgeOptimismSepoliaAddress || !CrossChainBridgeArbitrumSepoliaAddress) {
        throw new Error("CrossChainBridge addresses not found in the checkpoint files.");
    }

    // Get contract instances
    const CrossChainBridgeSepolia = await ethers.getContractAt("CrossChainBridge", CrossChainBridgeSepoliaAddress);
    const eIDArbitrumSepolia = 40231;
    const eIDOptimismSepolia = 40232;

    // Set peer for OptimismSepolia
    await CrossChainBridgeSepolia.connect(deployer).setPeer(eIDOptimismSepolia, ethers.utils.zeroPad(CrossChainBridgeOptimismSepoliaAddress, 32));
    await CrossChainBridgeSepolia.connect(deployer).setPeer(eIDArbitrumSepolia, ethers.utils.zeroPad(CrossChainBridgeArbitrumSepoliaAddress, 32));
    console.log("Peers set successfully");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

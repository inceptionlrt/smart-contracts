const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Paths to the checkpoint files
    const checkpointSepoliaFilePath = path.join(__dirname, '../../../deployment_checkpoint_sepolia.json');
    const checkpointOptimismFilePath = path.join(__dirname, '../../../deployment_checkpoint_optimism-sepolia.json');

    // Check if checkpoint files exist
    if (!fs.existsSync(checkpointSepoliaFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointSepoliaFilePath}`);
    }
    if (!fs.existsSync(checkpointOptimismFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointOptimismFilePath}`);
    }

    // Read and parse the JSON files
    const checkpointDataSepolia = JSON.parse(fs.readFileSync(checkpointSepoliaFilePath, 'utf8'));
    const checkpointDataOptimism = JSON.parse(fs.readFileSync(checkpointOptimismFilePath, 'utf8'));

    // Fetch addresses from the checkpoint files
    const LZCrossChainBridgeSepoliaAddress = checkpointDataSepolia.LZCrossChainBridge;
    const LZCrossChainBridgeOptimismSepoliaAddress = checkpointDataOptimism.LZCrossChainBridge;

    if (!LZCrossChainBridgeSepoliaAddress || !LZCrossChainBridgeOptimismSepoliaAddress) {
        throw new Error("LZCrossChainBridge addresses not found in the checkpoint files.");
    }
    
    // Get contract instances
    const LZCrossChainBridgeOptimismSepolia = await ethers.getContractAt("LZCrossChainBridge", LZCrossChainBridgeOptimismSepoliaAddress);
    const eIdSepolia = 40161;

    // Set peer for Sepolia
    await LZCrossChainBridgeOptimismSepolia.connect(deployer).setPeer(eIdSepolia, ethers.utils.zeroPad(LZCrossChainBridgeSepoliaAddress, 32));
    console.log(`Bridge at address ${LZCrossChainBridgeOptimismSepoliaAddress} was set successfully with peer at address ${LZCrossChainBridgeSepoliaAddress} at Sepolia`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

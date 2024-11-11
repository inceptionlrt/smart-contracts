import { ethers, upgrades, run, network } from "hardhat";
import axios from "axios";
import * as fs from 'fs';
import path from "path";
require("dotenv").config();

const jsonFilePath = path.resolve(__dirname, "../../../deployment_checkpoint_optimism-sepolia.json");
const OPERATOR_ADDRESS = process.env.OPERATOR_ADDRESS;
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY;
const verifiedContracts = new Set<string>();

async function main() {
    // Verify JSON file exists
    if (!fs.existsSync(jsonFilePath)) {
        console.error(`Error: JSON file does not exist at path: ${jsonFilePath}`);
        process.exit(1);
    }

    // Load contract addresses
    const contractData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));
    const lzCrossChainAdapterL2Address = contractData.LZCrossChainAdapterL2;

    if (!lzCrossChainAdapterL2Address) {
        console.error("Error: LZCrossChainAdapterL2 address not found in JSON file.");
        process.exit(1);
    }

    if (!OPERATOR_ADDRESS || !ethers.isAddress(OPERATOR_ADDRESS)) {
        console.error("Error: Invalid or missing OPERATOR_ADDRESS in environment variables.");
        process.exit(1);
    }

    // Deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    const checkpoint: { [key: string]: string } = {};

    // Deploy InceptionToken
    console.log("Deploying InceptionToken...");
    const InceptionTokenFactory = await ethers.getContractFactory("InceptionToken");
    const inceptionToken = await upgrades.deployProxy(
        InceptionTokenFactory,
        ["InceptionToken", "inETH"],
        { initializer: "initialize" }
    );
    await inceptionToken.waitForDeployment();
    checkpoint.InceptionToken = await inceptionToken.getAddress();
    console.log("InceptionToken deployed at:", checkpoint.InceptionToken);

    // Deploy InceptionRatioFeed
    console.log("Deploying InceptionRatioFeed...");
    const InceptionRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
    const inceptionRatioFeed = await upgrades.deployProxy(InceptionRatioFeedFactory, [], {
        initializer: "initialize",
    });
    await inceptionRatioFeed.waitForDeployment();
    checkpoint.InceptionRatioFeed = await inceptionRatioFeed.getAddress();
    console.log("InceptionRatioFeed deployed at:", checkpoint.InceptionRatioFeed);

    // Deploy InceptionOmniVault
    console.log("Deploying InceptionOmniVault...");
    const InceptionOmniVaultFactory = await ethers.getContractFactory("InceptionOmniVault");
    const inceptionOmniVault = await upgrades.deployProxy(
        InceptionOmniVaultFactory,
        ["InceptionOmniVault", OPERATOR_ADDRESS, checkpoint.InceptionToken, lzCrossChainAdapterL2Address],
        { initializer: "__InceptionOmniVault_init" }
    );
    await inceptionOmniVault.waitForDeployment();
    checkpoint.InceptionOmniVault = await inceptionOmniVault.getAddress();
    console.log("InceptionOmniVault deployed at:", checkpoint.InceptionOmniVault);

    // Set InceptionToken's vault to InceptionOmniVault
    console.log("Linking InceptionToken to InceptionOmniVault...");
    await inceptionToken.setVault(await inceptionOmniVault.getAddress());
    console.log("InceptionToken vault set to InceptionOmniVault.");

    // Update ratio for InceptionToken in InceptionRatioFeed
    console.log("Updating ratio for InceptionToken in InceptionRatioFeed...");
    const newRatio = ethers.parseEther("0.8");
    await inceptionRatioFeed.updateRatioBatch([checkpoint.InceptionToken], [newRatio]);
    console.log("Ratio updated in InceptionRatioFeed for InceptionToken.");

    // Set target receiver in LZCrossChainAdapterL2 to InceptionOmniVault
    console.log("Setting target receiver on LZCrossChainAdapterL2...");
    const lzCrossChainAdapterL2 = await ethers.getContractAt("ICrossChainBridgeL2", lzCrossChainAdapterL2Address);
    const setTargetReceiverTx = await lzCrossChainAdapterL2.setTargetReceiver(checkpoint.InceptionOmniVault);
    await setTargetReceiverTx.wait();
    console.log("Target receiver set to InceptionOmniVault on LZCrossChainAdapterL2.");

    // Save the new deployment checkpoint
    saveCheckpoint(checkpoint);

    // Optional: Verification logic
    const shouldVerify = !["hardhat", "optimism", "optimism-sepolia"].includes(network.name);
    if (shouldVerify) {
        await verifyUpgradeableContract(checkpoint.InceptionToken, ["InceptionToken", "iTOKEN"]);
        await verifyUpgradeableContract(checkpoint.InceptionRatioFeed, []);
        await verifyUpgradeableContract(checkpoint.InceptionOmniVault, [
            "InceptionOmniVault",
            OPERATOR_ADDRESS,
            checkpoint.InceptionToken,
            lzCrossChainAdapterL2Address,
        ]);
    }

    console.log("Deployment completed successfully! 🥳");
    console.log("Checkpoint saved:", checkpoint);
}

// Function to save checkpoint
function saveCheckpoint(checkpoint: any) {
    fs.writeFileSync(jsonFilePath, JSON.stringify(checkpoint, null, 2));
}

// Verification helper functions
async function verifyUpgradeableContract(proxyAddress: string, constructorArguments: any[]) {
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

    const isVerifiedImplementation = await isContractVerified(implementationAddress);
    if (isVerifiedImplementation) {
        console.log(`Implementation contract at ${implementationAddress} is already verified.`);
        return;
    }

    try {
        console.log(`Verifying implementation contract at: ${implementationAddress}`);
        await run("verify:verify", {
            address: implementationAddress,
            constructorArguments: [],
        });
    } catch (error) {
        console.error(`Failed to verify implementation contract at ${implementationAddress}:`, error);
    }

    const isVerifiedProxy = await isContractVerified(proxyAddress);
    if (isVerifiedProxy) {
        console.log(`Proxy contract at ${proxyAddress} is already verified.`);
        return;
    }

    try {
        console.log(`Verifying proxy contract at: ${proxyAddress}`);
        await run("verify:verify", {
            address: proxyAddress,
            constructorArguments: constructorArguments,
        });
    } catch (error) {
        console.error(`Failed to verify proxy contract at ${proxyAddress}:`, error);
    }

    console.log(`Finished verification for upgradeable contract at: ${proxyAddress}`);
}

async function isContractVerified(contractAddress: string): Promise<boolean> {
    if (verifiedContracts.has(contractAddress)) {
        console.log(`Contract ${contractAddress} is already in the verified cache.`);
        return true;
    }

    const apiUrl = `https://api.arbiscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ARBISCAN_API_KEY}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
            const isVerified = data.result[0].ABI !== "Contract source code not verified";
            if (isVerified) {
                verifiedContracts.add(contractAddress);
            }
            return isVerified;
        }
        console.error(`Verification status for ${contractAddress} not found or invalid response:`, data);
        return false;
    } catch (error) {
        console.error(`Error checking verification status for ${contractAddress}:`, error);
        return false;
    }
}

// Run the script
main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
});

import { ethers, upgrades, run } from "hardhat";
import * as fs from 'fs';
import axios from "axios";
require("dotenv").config();

const CHECKPOINT_FILE = "deployment_checkpoint.json";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const OPERATOR_ADDRESS = process.env.OPERATOR_ADDRESS;
const L1_TARGET = process.env.L1_TARGET;

const verifiedContracts = new Set<string>();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    let checkpoint: any = loadCheckpoint();

    // Supported chains for verification
    const supportedChains = [1, 4, 5, 42, 56, 137, 42161, 421614, 17000, 11155111];
    const networkData = await ethers.provider.getNetwork();
    const chainId = Number(networkData.chainId);
    console.log(`chainId is ${chainId}`);

    // ------------ Transaction 1: ProtocolConfig, RatioFeed ------------

    if (!checkpoint.ProtocolConfig) {
        console.log("Deploying ProtocolConfig...");
        const ProtocolConfig = await ethers.getContractFactory("ProtocolConfig");
        const protocolConfig = await upgrades.deployProxy(ProtocolConfig, [
            deployer.address, OPERATOR_ADDRESS, deployer.address
        ], { initializer: "initialize" });
        await protocolConfig.waitForDeployment();
        checkpoint.ProtocolConfig = await protocolConfig.getAddress();
        saveCheckpoint(checkpoint);
        console.log("ProtocolConfig deployed at:", checkpoint.ProtocolConfig);
    }

    if (!checkpoint.RatioFeed) {
        console.log("Deploying RatioFeed...");
        const RatioFeed = await ethers.getContractFactory("RatioFeed");
        const ratioFeed = await upgrades.deployProxy(
            RatioFeed,
            [checkpoint.ProtocolConfig, 1000000],
            { initializer: "initialize" }
        );
        await ratioFeed.waitForDeployment();
        checkpoint.RatioFeed = await ratioFeed.getAddress();
        saveCheckpoint(checkpoint);
        console.log("RatioFeed deployed at:", checkpoint.RatioFeed);
    }

    // ------------ Transaction 2: InceptionToken ------------

    if (!checkpoint.InceptionToken) {
        console.log("Deploying InceptionToken...");
        const InceptionToken = await ethers.getContractFactory("InceptionToken");
        const inceptionToken = await upgrades.deployProxy(
            InceptionToken,
            ["InceptionToken", "iETH"], // Name and symbol
            { initializer: "initialize" }
        );
        await inceptionToken.waitForDeployment();
        checkpoint.InceptionToken = await inceptionToken.getAddress();
        saveCheckpoint(checkpoint);
        console.log("InceptionToken deployed at:", checkpoint.InceptionToken);
    }

    // ------------ Transaction 3: CrossChainAdapterArbitrumL2 ------------

    if (!checkpoint.CrossChainAdapterArbitrumL2) {
        console.log("Deploying CrossChainAdapterArbitrumL2...");
        const CrossChainAdapterArbitrumL2 = await ethers.getContractFactory("CrossChainAdapterArbitrumL2");
        const crossChainAdapterArbitrumL2 = await upgrades.deployProxy(
            CrossChainAdapterArbitrumL2,
            [L1_TARGET, OPERATOR_ADDRESS],
            { initializer: "initialize" }
        );
        await crossChainAdapterArbitrumL2.waitForDeployment();
        checkpoint.CrossChainAdapterArbitrumL2 = await crossChainAdapterArbitrumL2.getAddress();
        saveCheckpoint(checkpoint);
        console.log("CrossChainAdapterArbitrumL2 deployed at:", checkpoint.CrossChainAdapterArbitrumL2);
    }

    // ------------ Transaction 4: InceptionOmniVault ------------

    if (!checkpoint.InceptionOmniVault) {
        console.log("Deploying InceptionOmniVault...");
        const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");
        const inceptionOmniVault = await upgrades.deployProxy(
            InceptionOmniVault,
            ["Inception Vault", OPERATOR_ADDRESS, checkpoint.InceptionToken, checkpoint.CrossChainAdapterArbitrumL2],
            { initializer: "__InceptionOmniVault_init" }
        );
        await inceptionOmniVault.waitForDeployment();
        checkpoint.InceptionOmniVault = await inceptionOmniVault.getAddress();
        saveCheckpoint(checkpoint);
        console.log("InceptionOmniVault deployed at:", checkpoint.InceptionOmniVault);
    }

    // Set vault in InceptionToken after InceptionOmniVault is deployed
    const inceptionTokenContract = await ethers.getContractAt("InceptionToken", checkpoint.InceptionToken);
    await inceptionTokenContract.setVault(checkpoint.InceptionOmniVault);

    // Set L1 target for CrossChainAdapterArbitrumL2
    const crossChainAdapterContract = await ethers.getContractAt("CrossChainAdapterArbitrumL2", checkpoint.CrossChainAdapterArbitrumL2);
    await crossChainAdapterContract.setL1Target(L1_TARGET);

    // Final Verification
    await verifyContracts(
        chainId,
        supportedChains,
        checkpoint.ProtocolConfig,
        checkpoint.RatioFeed,
        checkpoint.InceptionToken,
        checkpoint.CrossChainAdapterArbitrumL2,
        checkpoint.InceptionOmniVault
    );

    console.log("Deployment completed successfully! 🥳");
    console.log("Checkpoint saved:", checkpoint);
}

// Save deployment checkpoint
function saveCheckpoint(checkpoint: any) {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

// Load deployment checkpoint
function loadCheckpoint(): any {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    }
    return {};
}

// Function to check if the contract is verified
async function isContractVerified(contractAddress: string): Promise<boolean> {
    // Check the cached verified contracts first
    if (verifiedContracts.has(contractAddress)) {
        console.log(`Contract ${contractAddress} is already in the verified cache.`);
        return true;
    }

    const apiUrl = `https://api.arbiscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check if the response is successful and has the expected structure
        if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
            const isVerified = data.result[0].ABI !== "Contract source code not verified";
            if (isVerified) {
                verifiedContracts.add(contractAddress); // Add to the cache if verified
            }
            return isVerified;
        }
        console.error(`Verification status for ${contractAddress} not found or invalid response:`, data);
        return false; // Assume not verified on invalid response
    } catch (error) {
        console.error(`Error checking verification status for ${contractAddress}:`, error);
        return false; // Assume not verified on error
    }
}

// Function to verify upgradeable contracts (Transparent Proxy)
async function verifyUpgradeableContract(proxyAddress: string, constructorArguments: any[]) {
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

    // Check if implementation is already verified
    const isVerifiedImplementation = await isContractVerified(implementationAddress);
    if (isVerifiedImplementation) {
        console.log(`Implementation contract at ${implementationAddress} is already verified.`);
        return;
    }

    // Verify the implementation contract
    try {
        console.log(`Verifying implementation contract at: ${implementationAddress}`);
        await run("verify:verify", {
            address: implementationAddress,
            constructorArguments: [] // Assuming no constructor arguments for implementation
        });
    } catch (error) {
        console.error(`Failed to verify implementation contract at ${implementationAddress}:`, error);
    }

    // Check if proxy is already verified
    const isVerifiedProxy = await isContractVerified(proxyAddress);
    if (isVerifiedProxy) {
        console.log(`Proxy contract at ${proxyAddress} is already verified.`);
        return;
    }

    // Verify the proxy contract
    try {
        console.log(`Verifying proxy contract at: ${proxyAddress}`);
        await run("verify:verify", {
            address: proxyAddress,
            constructorArguments: constructorArguments // Pass constructor arguments for the proxy contract
        });
    } catch (error) {
        console.error(`Failed to verify proxy contract at ${proxyAddress}:`, error);
    }

    console.log(`Finished verification for upgradeable contract at: ${proxyAddress}`);
}

// Utility function to handle verifications
async function verifyContracts(
    chainId: number,
    supportedChains: number[],
    ...addresses: string[]
) {
    if (supportedChains.includes(chainId) && ETHERSCAN_API_KEY) {
        for (const address of addresses) {
            if (address) {
                try {
                    console.log(`Verifying contract at ${address}`);
                    await verifyUpgradeableContract(address, []);
                } catch (error) {
                    console.error(`Verification failed for ${address}:`, error);
                }
            }
        }
    } else {
        console.log("Skipping verification - unsupported chain or missing API key");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

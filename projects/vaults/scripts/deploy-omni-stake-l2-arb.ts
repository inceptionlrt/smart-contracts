import { ethers, upgrades, run } from "hardhat";
import * as fs from 'fs';
require("dotenv").config();

const CHECKPOINT_FILE = "deployment_checkpoint.json";

const CROSS_CHAIN_ADAPTER_L1_ADDRESS = "0xA6485be0890EB9231873f75af4B8d9447d7f3f88";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    // Load checkpoint data (if it exists)
    let checkpoint: any = loadCheckpoint();

    // Supported chains for verification
    const supportedChains = [1, 4, 5, 42, 56, 137, 17000, 42161, 11155111];
    const networkData = await ethers.provider.getNetwork();
    const chainId = Number(networkData.chainId);
    console.log(`chainId is ${chainId}`);

    // ------------ Transaction 1: InceptionToken Deployment ------------
    if (!checkpoint.InceptionToken) {
        console.log("Deploying InceptionToken...");
        const InceptionToken = await ethers.getContractFactory("InceptionToken");
        const inceptionToken = await upgrades.deployProxy(
            InceptionToken,
            [
                "Inception Token",
                "InETH"
            ],
            { initializer: "initialize" }
        );

        await inceptionToken.waitForDeployment();
        checkpoint.InceptionToken = await inceptionToken.getAddress();
        saveCheckpoint(checkpoint);
        console.log("InceptionToken deployed at:", checkpoint.InceptionToken);
    }

    // ------------ Transaction 2: InceptionOmniVault Deployment ------------
    if (!checkpoint.InceptionOmniVault) {
        console.log("Deploying InceptionOmniVault...");
        const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");

        const inceptionOmniVault = await upgrades.deployProxy(
            InceptionOmniVault,
            [
                "Inception Vault",
                deployer.address,          // Operator
                checkpoint.InceptionToken,
                checkpoint.CrossChainAdapterArbitrumL2
            ],
            { initializer: "__InceptionOmniVault_init" }
        );

        await inceptionOmniVault.waitForDeployment();
        checkpoint.InceptionOmniVault = await inceptionOmniVault.getAddress();
        saveCheckpoint(checkpoint);
        console.log("InceptionOmniVault deployed at:", checkpoint.InceptionOmniVault);

        // Set the vault in InceptionToken
        const InceptionToken = await ethers.getContractAt("InceptionToken", checkpoint.InceptionToken);
        const setVaultTx = await InceptionToken.setVault(checkpoint.InceptionOmniVault);
        await setVaultTx.wait();
        console.log("Vault set in InceptionToken:", checkpoint.InceptionOmniVault);
    }

    // ------------ Transaction 3: CrossChainAdapterArbitrumL2 Deployment ------------
    if (!checkpoint.CrossChainAdapterArbitrumL2) {
        console.log("Deploying CrossChainAdapterArbitrumL2...");
        const CrossChainAdapterArbitrumL2 = await ethers.getContractFactory("CrossChainAdapterArbitrumL2");

        const crossChainAdapterArbitrumL2 = await upgrades.deployProxy(
            CrossChainAdapterArbitrumL2,
            [
                CROSS_CHAIN_ADAPTER_L1_ADDRESS,
                deployer.address
            ],
            { initializer: "initialize" }
        );

        await crossChainAdapterArbitrumL2.waitForDeployment();
        checkpoint.CrossChainAdapterArbitrumL2 = await crossChainAdapterArbitrumL2.getAddress();
        saveCheckpoint(checkpoint);
        console.log("CrossChainAdapterArbitrumL2 deployed at:", checkpoint.CrossChainAdapterArbitrumL2);

        // Set vault in CrossChainAdapterArbitrumL2
        const setVaultTx = await crossChainAdapterArbitrumL2.setVault(checkpoint.InceptionOmniVault);
        await setVaultTx.wait();
        console.log("Vault set in CrossChainAdapterArbitrumL2:", checkpoint.InceptionOmniVault);
    }

    // Verifications for the contracts deployed
    await verifyContracts(
        chainId,
        supportedChains,
        checkpoint.InceptionToken,
        checkpoint.InceptionOmniVault,
        checkpoint.CrossChainAdapterArbitrumL2,
        deployer
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

// Utility function to handle verifications
async function verifyContracts(
    chainId: number,
    supportedChains: number[],
    address1: string,
    address2: string | null,
    address3: string | null,
    deployer: any
) {
    if (supportedChains.includes(chainId) && process.env.ETHERSCAN_API_KEY) {
        if (address1) {
            try {
                console.log(`Verifying contract at ${address1}`);
                await run("verify:verify", {
                    address: address1,
                    constructorArguments: [],
                });
            } catch (error) {
                console.error(`Verification failed for ${address1}:`, error);
            }
        }

        if (address2) {
            try {
                console.log(`Verifying contract at ${address2}`);
                await run("verify:verify", {
                    address: address2,
                    constructorArguments: [],
                });
            } catch (error) {
                console.error(`Verification failed for ${address2}:`, error);
            }
        }

        if (address3) {
            try {
                console.log(`Verifying contract at ${address3}`);
                await run("verify:verify", {
                    address: address3,
                    constructorArguments: [],
                });
            } catch (error) {
                console.error(`Verification failed for ${address3}:`, error);
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

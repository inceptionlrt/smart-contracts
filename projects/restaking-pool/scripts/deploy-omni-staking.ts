import { ethers, upgrades, run } from "hardhat";
import * as fs from 'fs';
require("dotenv").config();

const CHECKPOINT_FILE = "deployment_checkpoint.json";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    // Load checkpoint data (if it exists)
    let checkpoint: any = loadCheckpoint();

    // Supported chains for verification
    const supportedChains = [1, 4, 5, 42, 56, 137, 17000, 11155111];
    const networkData = await ethers.provider.getNetwork();
    const chainId = Number(networkData.chainId);
    console.log(`chainId is ${chainId}`);

    // ------------ Transaction 1: ProtocolConfig, RatioFeed, cToken ------------
    if (!checkpoint.ProtocolConfig) {
        console.log("Deploying ProtocolConfig...");
        const ProtocolConfig = await ethers.getContractFactory("ProtocolConfig");
        const protocolConfig = await upgrades.deployProxy(ProtocolConfig, [
            deployer.address, deployer.address, deployer.address
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

    if (!checkpoint.cToken) {
        console.log("Deploying cToken...");
        const cToken = await ethers.getContractFactory("cToken");
        const cTokenDeployed = await upgrades.deployProxy(
            cToken,
            [checkpoint.ProtocolConfig, "cETH", "cETH"],
            { initializer: "initialize" }
        );
        await cTokenDeployed.waitForDeployment();
        checkpoint.cToken = await cTokenDeployed.getAddress();
        saveCheckpoint(checkpoint);
        console.log("cToken deployed at:", checkpoint.cToken);
    }

    // Verifications for contracts deployed in Transaction 1
    await verifyContracts(
        chainId,
        supportedChains,
        checkpoint.ProtocolConfig,
        checkpoint.RatioFeed,
        checkpoint.cToken,
        deployer
    );

    // ------------ Transaction 2: InceptionLibrary, RestakingPool, TransactionStorage ------------
    if (!checkpoint.InceptionLibrary) {
        console.log("Deploying InceptionLibrary...");
        const InceptionLibrary = await ethers.getContractFactory("InceptionLibrary");
        const inceptionLibrary = await InceptionLibrary.deploy();
        await inceptionLibrary.waitForDeployment();
        checkpoint.InceptionLibrary = await inceptionLibrary.getAddress();
        saveCheckpoint(checkpoint);
        console.log("InceptionLibrary deployed at:", checkpoint.InceptionLibrary);
    }

    if (!checkpoint.RestakingPool) {
        console.log("Deploying RestakingPool...");
        const RestakingPoolFactory = await ethers.getContractFactory("RestakingPool", {
            libraries: {
                InceptionLibrary: checkpoint.InceptionLibrary,
            },
        });
        const restakingPool = await upgrades.deployProxy(
            RestakingPoolFactory,
            [checkpoint.ProtocolConfig, 30000000, 100000000],
            {
                initializer: "initialize",
                unsafeAllowLinkedLibraries: true
            }
        );
        await restakingPool.waitForDeployment();
        checkpoint.RestakingPool = await restakingPool.getAddress();
        saveCheckpoint(checkpoint);
        console.log("RestakingPool deployed at:", checkpoint.RestakingPool);
    }

    if (!checkpoint.TransactionStorage) {
        console.log("Deploying TransactionStorage...");
        const TransactionStorage = await ethers.getContractFactory("TransactionStorage");
        const transactionStorage = await TransactionStorage.deploy(deployer.address);
        await transactionStorage.waitForDeployment();
        checkpoint.TransactionStorage = await transactionStorage.getAddress();
        saveCheckpoint(checkpoint);
        console.log("TransactionStorage deployed at:", checkpoint.TransactionStorage);
    }

    // Verifications for contracts deployed in Transaction 2
    await verifyContracts(
        chainId,
        supportedChains,
        checkpoint.InceptionLibrary,
        checkpoint.RestakingPool,
        checkpoint.TransactionStorage,
        deployer
    );

    // ------------ Transaction 3: XERC20Lockbox, Rebalancer ------------
    if (!checkpoint.XERC20Lockbox) {
        console.log("Deploying XERC20Lockbox...");
        const XERC20Lockbox = await ethers.getContractFactory("XERC20Lockbox");
        const xerc20Lockbox = await XERC20Lockbox.deploy(
            checkpoint.cToken,
            deployer.address,
            true
        );
        await xerc20Lockbox.waitForDeployment();
        checkpoint.XERC20Lockbox = await xerc20Lockbox.getAddress();
        saveCheckpoint(checkpoint);
        console.log("XERC20Lockbox deployed at:", checkpoint.XERC20Lockbox);
    }

    if (!checkpoint.Rebalancer) {
        console.log("Deploying Rebalancer...");
        const Rebalancer = await ethers.getContractFactory("Rebalancer");
        const rebalancer = await upgrades.deployProxy(
            Rebalancer,
            [
                checkpoint.cToken,
                checkpoint.XERC20Lockbox,
                checkpoint.RestakingPool,
                checkpoint.TransactionStorage,
                checkpoint.RatioFeed,
                deployer.address
            ],
            { initializer: 'initialize' }
        );
        await rebalancer.waitForDeployment();
        checkpoint.Rebalancer = await rebalancer.getAddress();
        saveCheckpoint(checkpoint);
        console.log("Rebalancer (proxy) deployed at:", checkpoint.Rebalancer);
    }

    // Verifications for contracts deployed in Transaction 3
    await verifyContracts(
        chainId,
        supportedChains,
        checkpoint.XERC20Lockbox,
        checkpoint.Rebalancer,
        null,
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

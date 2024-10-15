import { ethers, upgrades, run } from "hardhat";
import axios from "axios";
import * as fs from 'fs';
require("dotenv").config();

const CHECKPOINT_FILE = "deployment_checkpoint.json";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY; // Ensure you have the Etherscan API key in your .env

// Utility function to introduce delay
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);
    const operatorAddress = process.env.OPERATOR_ADDRESS;

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
            deployer.address, operatorAddress, deployer.address
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
            [checkpoint.ProtocolConfig, "inETH", "inETH"],
            { initializer: "initialize" }
        );
        await cTokenDeployed.waitForDeployment();
        checkpoint.cToken = await cTokenDeployed.getAddress();
        saveCheckpoint(checkpoint);
        console.log("cToken deployed at:", checkpoint.cToken);
    }

    // Verifications for contracts deployed in Transaction 1
    await verifyUpgradeableContract(checkpoint.ProtocolConfig, []);
    await verifyUpgradeableContract(checkpoint.RatioFeed, [checkpoint.ProtocolConfig, 1000000]);
    await verifyUpgradeableContract(checkpoint.cToken, [checkpoint.ProtocolConfig, "inETH", "inETH"]);

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

    let transactionStorage;

    if (!checkpoint.TransactionStorage) {
        console.log("Deploying TransactionStorage...");
        const TransactionStorage = await ethers.getContractFactory("TransactionStorage");
        transactionStorage = await TransactionStorage.deploy(deployer.address);
        await transactionStorage.waitForDeployment();
        checkpoint.TransactionStorage = await transactionStorage.getAddress();
        saveCheckpoint(checkpoint);
        console.log("TransactionStorage deployed at:", checkpoint.TransactionStorage);
    }

    // Verifications for contracts deployed in Transaction 2
    await verifyNonUpgradeableContract(checkpoint.TransactionStorage, [deployer.address]);
    await verifyNonUpgradeableContract(checkpoint.InceptionLibrary, []);

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

    // Verify XERC20Lockbox by passing constructor arguments
    await verifyNonUpgradeableContract(checkpoint.XERC20Lockbox, [checkpoint.cToken, deployer.address, true]);

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
                operatorAddress
            ],
            { initializer: 'initialize' }
        );
        await rebalancer.waitForDeployment();
        checkpoint.Rebalancer = await rebalancer.getAddress();
        saveCheckpoint(checkpoint);
        console.log("Rebalancer (proxy) deployed at:", checkpoint.Rebalancer);
    }

    // Add a delay before verifying the Rebalancer
    await delay(30000); // Wait for 30 seconds to ensure the deployment is confirmed

    // Verifications for contracts deployed in Transaction 3
    await verifyUpgradeableContract(checkpoint.Rebalancer, [checkpoint.cToken, checkpoint.XERC20Lockbox, checkpoint.RestakingPool, checkpoint.TransactionStorage, checkpoint.RatioFeed, operatorAddress]);

    // ------------ Transaction 4: CrossChainAdapterArbitrumL1, CrossChainAdapterOptimismL1 ------------
    if (!checkpoint.CrossChainAdapterArbitrumL1) {
        console.log("Deploying CrossChainAdapterArbitrumL1...");
        const CrossChainAdapterArbitrumL1 = await ethers.getContractFactory("CrossChainAdapterArbitrumL1");
        const arbitrumAdapter = await upgrades.deployProxy(
            CrossChainAdapterArbitrumL1,
            [checkpoint.TransactionStorage, `${process.env.ARB_INBOX_SEPOLIA}`, operatorAddress],
            { initializer: "initialize" }
        );
        await arbitrumAdapter.waitForDeployment();
        checkpoint.CrossChainAdapterArbitrumL1 = await arbitrumAdapter.getAddress();
        saveCheckpoint(checkpoint);
        console.log("CrossChainAdapterArbitrumL1 deployed at:", checkpoint.CrossChainAdapterArbitrumL1);

        // Add Rebalancer to CrossChainAdapterArbitrumL1
        await arbitrumAdapter.setRebalancer(checkpoint.Rebalancer);

        // Add the Arbitrum adapter to TransactionStorage
        console.log("Adding Arbitrum Adapter to TransactionStorage...");
        const addArbitrumChainTx = await transactionStorage.addChainId(42161);  // Arbitrum Chain ID = 42161
        await addArbitrumChainTx.wait();
        const addArbitrumAdapterTx = await transactionStorage.addAdapter(42161, checkpoint.CrossChainAdapterArbitrumL1);
        await addArbitrumAdapterTx.wait();
        console.log("Arbitrum adapter added to TransactionStorage.");
    }

    if (!checkpoint.CrossChainAdapterOptimismL1) {
        console.log("Deploying CrossChainAdapterOptimismL1...");
        const CrossChainAdapterOptimismL1 = await ethers.getContractFactory("CrossChainAdapterOptimismL1");
        const optimismAdapter = await upgrades.deployProxy(
            CrossChainAdapterOptimismL1,
            [`${process.env.OPT_X_DOMAIN_MESSENGER_L1_SEPOLIA}`, `${process.env.OPT_L1_BRIDGE_SEPOLIA}`, checkpoint.TransactionStorage, operatorAddress],
            { initializer: "initialize" }
        );
        await optimismAdapter.waitForDeployment();
        checkpoint.CrossChainAdapterOptimismL1 = await optimismAdapter.getAddress();
        saveCheckpoint(checkpoint);
        console.log("CrossChainAdapterOptimismL1 deployed at:", checkpoint.CrossChainAdapterOptimismL1);

        // Add Rebalancer to CrossChainAdapterOptimismL1
        await optimismAdapter.setRebalancer(checkpoint.Rebalancer);

        // Add the Optimism adapter to TransactionStorage
        console.log("Adding Optimism Adapter to TransactionStorage...");
        const addOptimismChainTx = await transactionStorage.addChainId(10n);
        await addOptimismChainTx.wait();
        const addOptimismAdapterTx = await transactionStorage.addAdapter(10n, checkpoint.CrossChainAdapterOptimismL1);
        await addOptimismAdapterTx.wait();
        console.log("Optimism adapter added to TransactionStorage.");
    }

    // Verifications for contracts deployed in Transaction 4
    await verifyUpgradeableContract(checkpoint.CrossChainAdapterArbitrumL1, [checkpoint.TransactionStorage, `${process.env.ARB_INBOX_SEPOLIA}`, operatorAddress]);
    await verifyUpgradeableContract(checkpoint.CrossChainAdapterOptimismL1, [`${process.env.OPT_X_DOMAIN_MESSENGER_L1_SEPOLIA}`, `${process.env.OPT_L1_BRIDGE_SEPOLIA}`, checkpoint.TransactionStorage, operatorAddress]);

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

// Function to check if a contract is already verified
async function isContractVerified(contractAddress: string): Promise<boolean> {
    const apiUrl = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check if the response is successful and has the expected structure
        if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
            return data.result[0].ABI !== "Contract source code not verified";
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

// Function to verify non-upgradeable contracts
async function verifyNonUpgradeableContract(contractAddress: string, constructorArguments: any[]) {
    // Check if contract is already verified
    const isVerified = await isContractVerified(contractAddress);
    if (isVerified) {
        console.log(`Non-upgradeable contract at ${contractAddress} is already verified.`);
        return;
    }

    try {
        console.log(`Verifying non-upgradeable contract at: ${contractAddress}`);
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArguments // Pass constructor arguments for non-upgradeable contracts
        });
        console.log(`Successfully verified non-upgradeable contract at: ${contractAddress}`);
    } catch (error) {
        console.error(`Failed to verify non-upgradeable contract at ${contractAddress}:`, error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

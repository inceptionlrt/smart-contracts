import { ethers, upgrades, run, network } from "hardhat";
import axios from "axios";
import * as fs from 'fs';
import path from "path";
require("dotenv").config();

const checkpointPath = path.join(__dirname, '../../../deployment_checkpoint_sepolia.json');
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const verifiedContracts = new Set<string>();

// Utility function to introduce delay
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    if (!fs.existsSync(checkpointPath)) {
        console.error("Deployment checkpoint file not found!");
        process.exit(1);
    }
    const checkpoint = loadCheckpoint();
    if (!checkpoint.LZCrossChainAdapterL1) {
        console.error("LZCrossChainAdapterL1 address not found in the deployment checkpoint file!");
        process.exit(1);
    }

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);
    const operatorAddress = process.env.OPERATOR_ADDRESS;

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

    if (network.name !== "hardhat") {
        await verifyUpgradeableContract(checkpoint.ProtocolConfig, []);
        await verifyUpgradeableContract(checkpoint.RatioFeed, [checkpoint.ProtocolConfig, 1000000]);
        await verifyUpgradeableContract(checkpoint.cToken, [checkpoint.ProtocolConfig, "inETH", "inETH"]);
    }

    // ------------ Transaction 2: InceptionLibrary, RestakingPool ------------
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
        // Set target capacity and stake bonus parameters
        await restakingPool.setTargetFlashCapacity(1000000n);
        await restakingPool.setStakeBonusParams(10n, 5n, 50n);
        await restakingPool.setFlashUnstakeFeeParams(5n, 3n, 50n);
        const newMaxTVL = ethers.parseEther("101");
        await restakingPool.setMaxTVL(newMaxTVL);

        if (network.name !== "hardhat") {
            await verifyUpgradeableContract(checkpoint.RestakingPool, [checkpoint.ProtocolConfig, 30000000, 100000000]);
        }
    }

    if (network.name !== "hardhat") {
        await verifyNonUpgradeableContract(checkpoint.InceptionLibrary, []);
    }

    // ------------ Transaction 3: XERC20Lockbox, Rebalancer ------------
    if (!checkpoint.XERC20Lockbox) {
        console.log("Deploying XERC20Lockbox...");
        const XERC20Lockbox = await ethers.getContractFactory("XERC20Lockbox");
        const xerc20Lockbox = await upgrades.deployProxy(
            XERC20Lockbox,
            [checkpoint.cToken, checkpoint.cToken, true],
            { initializer: "initialize" }
        );
        await xerc20Lockbox.waitForDeployment();
        checkpoint.XERC20Lockbox = await xerc20Lockbox.getAddress();
        saveCheckpoint(checkpoint);
        console.log("XERC20Lockbox deployed at:", checkpoint.XERC20Lockbox);
    }

    if (network.name !== "hardhat") {
        await verifyUpgradeableContract(checkpoint.XERC20Lockbox, [checkpoint.cToken, checkpoint.cToken, true]);
    }

    if (!checkpoint.NativeRebalancer) {
        console.log("Deploying Rebalancer...");
        const Rebalancer = await ethers.getContractFactory("NativeRebalancer");
        const rebalancer = await upgrades.deployProxy(
            Rebalancer,
            [
                checkpoint.cToken,
                checkpoint.XERC20Lockbox,
                checkpoint.RestakingPool,
                checkpoint.LZCrossChainAdapterL1,
                checkpoint.RatioFeed,
                operatorAddress
            ],
            { initializer: 'initialize' }
        );
        await rebalancer.waitForDeployment();
        checkpoint.NativeRebalancer = await rebalancer.getAddress();
        await rebalancer.addChainId(421614n); //Arbitrum Sepolia Chain
        await rebalancer.addChainId(11155420n); //Optimism Sepolia Chain
        saveCheckpoint(checkpoint);
        console.log("Rebalancer (proxy) deployed at:", checkpoint.NativeRebalancer);
    }

    // Set target receiver in LZCrossChainAdapterL1 to Rebalancer address
    const lzCrossChainAdapterL1 = await ethers.getContractAt("ILZCrossChainAdapterL1", checkpoint.LZCrossChainAdapterL1);
    console.log("Setting target receiver on LZCrossChainAdapterL1...");
    const setTargetReceiverTx = await lzCrossChainAdapterL1.setTargetReceiver(checkpoint.NativeRebalancer);
    await setTargetReceiverTx.wait();
    console.log("Target receiver set to Rebalancer on LZCrossChainAdapterL1.");

    // Update ratio in RatioFeed to a non-1:1 ratio
    console.log("Updating ratio for cToken in RatioFeed...");
    const ratioFeedContract = await ethers.getContractAt("RatioFeed", checkpoint.RatioFeed);
    const newRatio = ethers.parseEther("0.8");
    const updateRatioTx = await ratioFeedContract.updateRatio(checkpoint.cToken, newRatio);
    await updateRatioTx.wait();
    console.log(`Ratio updated for ${checkpoint.cToken} to ${newRatio.toString()} in RatioFeed.`);

    // Call ProtocolConfig setters
    console.log("Setting up ProtocolConfig addresses...");
    const protocolConfig = await ethers.getContractAt("ProtocolConfig", checkpoint.ProtocolConfig);
    await protocolConfig.setRatioFeed(checkpoint.RatioFeed);
    await protocolConfig.setRestakingPool(checkpoint.RestakingPool);
    await protocolConfig.setRebalancer(checkpoint.NativeRebalancer);
    await protocolConfig.setCToken(checkpoint.cToken);
    console.log("ProtocolConfig addresses set successfully.");

    // Add a delay before verifying the Rebalancer
    if (network.name !== "hardhat") {
        await delay(30000);
        await verifyUpgradeableContract(checkpoint.NativeRebalancer, [checkpoint.cToken, checkpoint.XERC20Lockbox, checkpoint.RestakingPool, checkpoint.LZCrossChainAdapterL1, checkpoint.RatioFeed, operatorAddress]);
    }

    console.log("Deployment completed successfully! 🥳");
    console.log("Checkpoint saved:", checkpoint);
}

function saveCheckpoint(checkpoint: any) {
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

// Load deployment checkpoint
function loadCheckpoint(): any {
    if (fs.existsSync(checkpointPath)) {
        return JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
    }
    return {};
}

async function isContractVerified(contractAddress: string): Promise<boolean> {
    if (verifiedContracts.has(contractAddress)) {
        console.log(`Contract ${contractAddress} is already in the verified cache.`);
        return true;
    }

    const apiUrl = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;

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

async function verifyUpgradeableContract(proxyAddress: string, constructorArguments: any[]) {
    if (network.name === "hardhat") return; // Skip verification for hardhat

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
            constructorArguments: []
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
            constructorArguments: constructorArguments
        });
    } catch (error) {
        console.error(`Failed to verify proxy contract at ${proxyAddress}:`, error);
    }

    console.log(`Finished verification for upgradeable contract at: ${proxyAddress}`);
}

async function verifyNonUpgradeableContract(contractAddress: string, constructorArguments: any[]) {
    if (network.name === "hardhat") return; // Skip verification for hardhat

    const isVerified = await isContractVerified(contractAddress);
    if (isVerified) {
        console.log(`Non-upgradeable contract at ${contractAddress} is already verified.`);
        return;
    }

    try {
        console.log(`Verifying non-upgradeable contract at: ${contractAddress}`);
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArguments
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

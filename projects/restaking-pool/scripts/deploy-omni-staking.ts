import { ethers, upgrades, run } from "hardhat";
import axios from "axios";
import * as fs from 'fs';
require("dotenv").config();

const CHECKPOINT_FILE = "deployment_checkpoint.json";

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
    const networkName = networkData.name;
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
    await verifyContracts(
        chainId,
        supportedChains,
        checkpoint.ProtocolConfig,
        checkpoint.RatioFeed,
        checkpoint.cToken,
        [],
        networkName
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
    await verifyContracts(
        chainId,
        supportedChains,
        checkpoint.InceptionLibrary,
        checkpoint.RestakingPool,
        checkpoint.TransactionStorage,
        [deployer.address],
        networkName
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

    // Correctly verify XERC20Lockbox by passing constructor arguments
    await verifyContracts(
        chainId,
        supportedChains,
        checkpoint.XERC20Lockbox,
        null,
        [],
        [checkpoint.cToken, deployer.address, true],
        networkName
    );

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

    // Verifications for contracts deployed in Transaction 3
    await verifyContracts(
        chainId,
        supportedChains,
        checkpoint.XERC20Lockbox,
        checkpoint.Rebalancer,
        null,
        [],
        networkName
    );

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
    await verifyContracts(
        chainId,
        supportedChains,
        checkpoint.CrossChainAdapterArbitrumL1,
        checkpoint.CrossChainAdapterOptimismL1,
        null,
        [],
        networkName
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
    proxyAddress: string,
    implementationAddress: string | null,
    adminAddress: string | null,
    constructorArgs: any[],
    networkName: string
) {
    if (supportedChains.includes(chainId) && process.env.ETHERSCAN_API_KEY) {
        // Check and verify the implementation contract (no constructor args for upgradeable contracts)
        if (implementationAddress) {
            const isVerified = await isContractVerified(implementationAddress, networkName);
            if (!isVerified) {
                try {
                    console.log(`Verifying implementation: ${implementationAddress}`);
                    await run("verify:verify", {
                        address: implementationAddress,
                        constructorArguments: [], // Implementation should not have constructor args
                    });
                } catch (error) {
                    console.error(`Failed to verify implementation contract at ${implementationAddress}:`, error);
                }
            } else {
                console.log(`Implementation at ${implementationAddress} is already verified.`);
            }
        }

        // Check and verify the proxy contract
        if (proxyAddress) {
            const isVerified = await isContractVerified(proxyAddress, networkName);
            if (!isVerified) {
                try {
                    console.log(`Verifying proxy: ${proxyAddress}`);
                    await run("verify:verify", {
                        address: proxyAddress,
                        constructorArguments: constructorArgs,
                    });
                } catch (error) {
                    console.error(`Verification failed for ${proxyAddress}:`, error);
                }
            } else {
                console.log(`Proxy at ${proxyAddress} is already verified.`);
            }
        }

        // Check and verify the ProxyAdmin contract
        if (adminAddress) {
            const isVerified = await isContractVerified(adminAddress, networkName);
            if (!isVerified) {
                try {
                    console.log(`Verifying proxy admin: ${adminAddress}`);
                    await run("verify:verify", {
                        address: adminAddress,
                    });
                } catch (error) {
                    console.error(`Failed to verify ProxyAdmin contract at ${adminAddress}:`, error);
                }
            } else {
                console.log(`ProxyAdmin at ${adminAddress} is already verified.`);
            }
        }
    } else {
        console.log("Skipping verification - unsupported chain or missing API key");
    }

    async function isContractVerified(address: string, network: string): Promise<boolean> {
        const apiUrl = getEtherscanApiUrl(network);

        try {
            const response = await axios.get(apiUrl, {
                params: {
                    module: "contract",
                    action: "getsourcecode",
                    address: address,
                    apikey: process.env.ETHERSCAN_API_KEY,
                },
            });

            const { data } = response;
            if (data.status === "1" && data.result && data.result[0].ABI !== "Contract source code not verified") {
                return true; // Contract is verified
            }
            return false; // Contract is not verified
        } catch (error) {
            console.error(`Error checking verification status for ${address}:`, error);
            return false; // Assume not verified on error
        }
    }

    function getEtherscanApiUrl(network: string): string {
        switch (network) {
            case "mainnet":
                return "https://api.etherscan.io/api";
            case "goerli":
                return "https://api-goerli.etherscan.io/api";
            case "holesky":
                return "https://api-holesky.etherscan.io/api";
            // Add other network URLs if needed
            default:
                throw new Error(`Unsupported network: ${network}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

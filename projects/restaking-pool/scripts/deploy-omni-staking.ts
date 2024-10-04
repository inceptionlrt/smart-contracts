import { ethers, upgrades, run } from "hardhat";
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log(`Deployer Address: ${deployer.address}`);

    // Supported chains for verification
    const supportedChains = [1, 4, 5, 42, 56, 137, 17000];
    const networkData = await ethers.provider.getNetwork();
    const chainId = Number(networkData.chainId);

    console.log(`chainId is ${chainId}`);

    // ------------ Transaction 1: ProtocolConfig, RatioFeed, cToken ------------

    // Step 1: Deploy ProtocolConfig contract
    console.log("Deploying ProtocolConfig...");
    const ProtocolConfig = await ethers.getContractFactory("ProtocolConfig");
    const protocolConfig = await upgrades.deployProxy(ProtocolConfig, [
        deployer.address, // governance address
        deployer.address, // operator address
        deployer.address  // treasury address
    ], { initializer: "initialize" });
    await protocolConfig.waitForDeployment();
    const protocolConfigAddress = await protocolConfig.getAddress();
    console.log("ProtocolConfig deployed at:", protocolConfigAddress);

    // Step 2: Deploy RatioFeed and set it in ProtocolConfig
    console.log("Deploying RatioFeed...");
    const RatioFeed = await ethers.getContractFactory("RatioFeed");
    const ratioFeed = await upgrades.deployProxy(
        RatioFeed,
        [protocolConfigAddress, 1000000], // ratioThreshold = 1% (in parts per million)
        { initializer: "initialize" }
    );
    await ratioFeed.waitForDeployment();
    const ratioFeedAddress = await ratioFeed.getAddress();
    console.log("RatioFeed deployed at:", ratioFeedAddress);

    // Step 3: Deploy cToken contract and set it in ProtocolConfig
    console.log("Deploying cToken...");
    const cToken = await ethers.getContractFactory("cToken");
    const cTokenDeployed = await upgrades.deployProxy(
        cToken,
        [protocolConfigAddress, "cETH", "cETH"],
        { initializer: "initialize" }
    );
    await cTokenDeployed.waitForDeployment();
    const cTokenAddress = await cTokenDeployed.getAddress();
    console.log("cToken deployed at:", cTokenAddress);

    // Verifications for contracts deployed in Transaction 1
    await verifyContracts(
        chainId,
        supportedChains,
        protocolConfigAddress,
        ratioFeedAddress,
        cTokenAddress,
        deployer
    );

    // ------------ Transaction 2: InceptionLibrary, RestakingPool, TransactionStorage ------------

    // Step 4: Deploy the InceptionLibrary
    console.log("Deploying InceptionLibrary...");
    const InceptionLibrary = await ethers.getContractFactory("InceptionLibrary");
    const inceptionLibrary = await InceptionLibrary.deploy();
    await inceptionLibrary.waitForDeployment();
    const inceptionLibraryAddress = await inceptionLibrary.getAddress();
    console.log("InceptionLibrary deployed at:", inceptionLibraryAddress);

    // Step 5: Deploy RestakingPool with unsafeAllowLinkedLibraries flag for library linking
    console.log("Deploying RestakingPool...");
    const RestakingPoolFactory = await ethers.getContractFactory("RestakingPool", {
        libraries: {
            InceptionLibrary: inceptionLibraryAddress,
        },
    });

    const restakingPool = await upgrades.deployProxy(
        RestakingPoolFactory,
        [protocolConfigAddress, 30000000, 100000000], // Gas limit and max TVL as parameters
        {
            initializer: "initialize",
            unsafeAllowLinkedLibraries: true // Allow linking external libraries for upgradeable contracts
        }
    );
    await restakingPool.waitForDeployment();
    const restakingPoolAddress = await restakingPool.getAddress();
    console.log("RestakingPool deployed at:", restakingPoolAddress);

    // Step 6: Deploy TransactionStorage contract
    console.log("Deploying TransactionStorage...");
    const TransactionStorage = await ethers.getContractFactory("TransactionStorage");
    const transactionStorage = await TransactionStorage.deploy(deployer.address);
    await transactionStorage.waitForDeployment();
    const transactionStorageAddress = await transactionStorage.getAddress();
    console.log("TransactionStorage deployed at:", transactionStorageAddress);

    // Verifications for contracts deployed in Transaction 2
    await verifyContracts(
        chainId,
        supportedChains,
        inceptionLibraryAddress,
        restakingPoolAddress,
        transactionStorageAddress,
        deployer
    );

    // ------------ Transaction 3: XERC20Lockbox, Rebalancer ------------

    // Step 7: Deploy XERC20Lockbox (Lockbox)
    console.log("Deploying XERC20Lockbox...");
    const XERC20Lockbox = await ethers.getContractFactory("XERC20Lockbox");
    const xerc20Lockbox = await XERC20Lockbox.deploy(
        cTokenAddress,  // XERC20 token address
        deployer.address,  // ERC20 token address, replace if needed
        true // true if the token is the native gas token (ETH in this case)
    );
    await xerc20Lockbox.waitForDeployment();
    const lockboxAddress = await xerc20Lockbox.getAddress();
    console.log("XERC20Lockbox deployed at:", lockboxAddress);

    // Step 8: Deploy Rebalancer contract as an upgradeable proxy
    console.log("Deploying Rebalancer...");
    const Rebalancer = await ethers.getContractFactory("Rebalancer");
    const rebalancer = await upgrades.deployProxy(
        Rebalancer,
        [
            cTokenAddress,              // inETHAddress (cToken in this case)
            lockboxAddress,             // lockbox address
            restakingPoolAddress,       // liquidity pool (RestakingPool)
            transactionStorageAddress,  // transactionStorage
            ratioFeedAddress,           // ratioFeed
            deployer.address            // operator (deployer)
        ],
        { initializer: 'initialize' }
    );
    await rebalancer.waitForDeployment();
    const rebalancerAddress = await rebalancer.getAddress();
    console.log("Rebalancer (proxy) deployed at:", rebalancerAddress);

    // Verifications for contracts deployed in Transaction 3
    await verifyContracts(
        chainId,
        supportedChains,
        lockboxAddress,
        rebalancerAddress,
        null, // No third address to verify here
        deployer
    );

    // Output deployed addresses
    console.log("Congrats, deployment successful! 🥳");
    console.log("RestakingPool deployed at:", restakingPoolAddress);
    console.log("InceptionLibrary deployed at:", inceptionLibraryAddress);
    console.log("RatioFeed deployed at:", ratioFeedAddress);
    console.log("ProtocolConfig deployed at:", protocolConfigAddress);
    console.log("cToken deployed at:", cTokenAddress);
    console.log("TransactionStorage deployed at:", transactionStorageAddress);
    console.log("XERC20Lockbox deployed at:", lockboxAddress);
    console.log("Rebalancer deployed at:", rebalancerAddress);
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

import { ethers, upgrades } from "hardhat";
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log(`Deployer Address: ${deployer.address}`);

    // Step 1: Deploy ProtocolConfig contract
    console.log("Deploying ProtocolConfig...");
    const ProtocolConfig = await ethers.getContractFactory("ProtocolConfig");
    const protocolConfig = await upgrades.deployProxy(ProtocolConfig, [
        deployer.address, // governance address
        deployer.address, // operator address
        deployer.address  // treasury address
    ], { initializer: "initialize" });
    await protocolConfig.deployed();
    const protocolConfigAddress = protocolConfig.address;
    console.log("ProtocolConfig deployed at:", protocolConfigAddress);

    // Step 2: Deploy RatioFeed and set it in ProtocolConfig
    console.log("Deploying RatioFeed...");
    const RatioFeed = await ethers.getContractFactory("RatioFeed");
    const ratioFeed = await upgrades.deployProxy(
        RatioFeed,
        [protocolConfigAddress, 1000000], // ratioThreshold = 1% (in parts per million)
        { initializer: "initialize" }
    );
    await ratioFeed.deployed();
    const ratioFeedAddress = ratioFeed.address;
    console.log("RatioFeed deployed at:", ratioFeedAddress);

    // Set RatioFeed in ProtocolConfig
    console.log("Setting RatioFeed in ProtocolConfig...");
    const setRatioFeedTx = await protocolConfig.setRatioFeed(ratioFeedAddress);
    await setRatioFeedTx.wait();
    console.log("RatioFeed set in ProtocolConfig.");

    // Step 3: Deploy cToken contract and set it in ProtocolConfig
    console.log("Deploying cToken...");
    const cToken = await ethers.getContractFactory("cToken");
    const cTokenDeployed = await upgrades.deployProxy(
        cToken,
        [protocolConfigAddress, "cETH", "cETH"],
        { initializer: "initialize" }
    );
    await cTokenDeployed.deployed();
    const cTokenAddress = cTokenDeployed.address;
    console.log("cToken deployed at:", cTokenAddress);

    // Step 4: Deploy RestakingPool and set it in ProtocolConfig
    console.log("Deploying RestakingPool...");
    const RestakingPool = await ethers.getContractFactory("RestakingPool");
    const restakingPool = await upgrades.deployProxy(
        RestakingPool,
        [protocolConfigAddress, 30000000, 100000000], // Gas limit and max TVL as parameters
        { initializer: "initialize" }
    );
    await restakingPool.deployed();
    const restakingPoolAddress = restakingPool.address;
    console.log("RestakingPool deployed at:", restakingPoolAddress);

    // Set RestakingPool in ProtocolConfig
    console.log("Setting RestakingPool in ProtocolConfig...");
    const setRestakingPoolTx = await protocolConfig.setRestakingPool(restakingPoolAddress);
    await setRestakingPoolTx.wait();
    console.log("RestakingPool set in ProtocolConfig.");

    // Step 5: Deploy TransactionStorage contract
    console.log("Deploying TransactionStorage...");
    const TransactionStorage = await ethers.getContractFactory("TransactionStorage");
    const transactionStorage = await TransactionStorage.deploy(deployer.address);
    await transactionStorage.deployed();
    const transactionStorageAddress = transactionStorage.address;
    console.log("TransactionStorage deployed at:", transactionStorageAddress);

    // Step 6: Deploy Rebalancer contract as an upgradeable proxy
    console.log("Deploying Rebalancer...");
    const Rebalancer = await ethers.getContractFactory("Rebalancer");
    const rebalancer = await upgrades.deployProxy(
        Rebalancer,
        [cTokenAddress, restakingPoolAddress, transactionStorageAddress, ratioFeedAddress],
        { initializer: 'initialize' }
    );
    await rebalancer.deployed();
    const rebalancerAddress = rebalancer.address;
    console.log("Rebalancer (proxy) deployed at:", rebalancerAddress);

    // Step 7: Set Rebalancer and cToken in ProtocolConfig
    console.log("Configuring ProtocolConfig...");
    const setRebalancerTx = await protocolConfig.setRebalancer(rebalancerAddress);
    await setRebalancerTx.wait();
    const setCtokenTx = await protocolConfig.setCToken(cTokenAddress);
    await setCtokenTx.wait();
    console.log("ProtocolConfig updated with Rebalancer and cToken addresses.");

    // Step 8: Deploy XERC20Lockbox (Lockbox)
    console.log("Deploying XERC20Lockbox...");
    const XERC20Lockbox = await ethers.getContractFactory("XERC20Lockbox");
    const xerc20Lockbox = await XERC20Lockbox.deploy(
        cTokenAddress,  // XERC20 token address
        deployer.address,  // ERC20 token address, replace if needed
        true // true if the token is the native gas token (ETH in this case)
    );
    await xerc20Lockbox.deployed();
    const lockboxAddress = xerc20Lockbox.address;
    console.log("XERC20Lockbox deployed at:", lockboxAddress);

    // Set Lockbox in XERC20 (cToken)
    console.log("Setting Lockbox in cToken...");
    const setLockboxTx = await cTokenDeployed.setLockbox(lockboxAddress);
    await setLockboxTx.wait();
    console.log("Lockbox set in cToken.");

    // Output deployed addresses
    console.log("Congrats, deployment successful! 🥳");
    console.log("ProtocolConfig deployed at:", protocolConfigAddress);
    console.log("cToken deployed at:", cTokenAddress);
    console.log("TransactionStorage:", transactionStorageAddress);
    console.log("Rebalancer (proxy):", rebalancerAddress);
    console.log("XERC20Lockbox deployed at:", lockboxAddress);
    console.log("RatioFeed deployed at:", ratioFeedAddress);
    console.log("RestakingPool deployed at:", restakingPoolAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

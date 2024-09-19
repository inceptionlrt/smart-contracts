import { ethers, upgrades } from "hardhat";
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();

    // Fetch addresses from environment variables
    const inETHAddress = process.env.IN_ETH_ADDRESS;
    const lockboxAddress = process.env.LOCKBOX_ADDRESS;
    const liqPoolAddress = process.env.LIQ_POOL_ADDRESS;
    const ratioFeedAddress = process.env.RATIO_FEED_ADDRESS;

    if (!inETHAddress || !lockboxAddress || !liqPoolAddress || !ratioFeedAddress) {
        throw new Error("Missing environment variables. Please set IN_ETH_ADDRESS, LOCKBOX_ADDRESS, LIQ_POOL_ADDRESS, and RATIO_FEED_ADDRESS.");
    }

    // Deploy TransactionStorage first with deployer's address
    console.log("Deploying TransactionStorage...");
    const TransactionStorage = await ethers.getContractFactory("TransactionStorage");
    const transactionStorage = await TransactionStorage.deploy(deployer.address);
    await transactionStorage.waitForDeployment();
    const transactionStorageAddress = await transactionStorage.getAddress();
    console.log("TransactionStorage deployed at:", transactionStorageAddress);

    // Deploy Rebalancer contract as an upgradeable proxy
    console.log("Deploying Rebalancer...");
    const Rebalancer = await ethers.getContractFactory("Rebalancer");
    const rebalancer = await upgrades.deployProxy(
        Rebalancer,
        [inETHAddress, lockboxAddress, liqPoolAddress, transactionStorageAddress, ratioFeedAddress],
        { initializer: 'initialize' }
    );
    await rebalancer.waitForDeployment();
    const rebalancerAddress = await rebalancer.getAddress();
    console.log("Rebalancer (proxy) deployed at:", rebalancerAddress);

    // Deploy MockCrossChainAdapter with deployer's address and the transactionStorage
    console.log("Deploying MockCrossChainAdapter...");
    const MockCrossChainAdapter = await ethers.getContractFactory("MockCrossChainAdapter");
    const mockCrossChainAdapter = await MockCrossChainAdapter.deploy(
        transactionStorageAddress,
        rebalancerAddress
    );
    await mockCrossChainAdapter.waitForDeployment();
    const mockCrossChainAdapterAddress = await mockCrossChainAdapter.getAddress();
    console.log("MockCrossChainAdapter deployed at:", mockCrossChainAdapterAddress);

    // Output deployed addresses
    console.log("Congrats, deployment successful! 🥳");
    console.log("TransactionStorage:", transactionStorageAddress);
    console.log("Rebalancer (proxy):", rebalancerAddress);
    console.log("MockCrossChainAdapter:", mockCrossChainAdapterAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

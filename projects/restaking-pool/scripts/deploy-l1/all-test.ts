import { ethers, upgrades, run } from "hardhat";
import fs from "fs";
import path from "path";

// Utility functions for checkpoint handling
function isContractDeployed(checkpointData: any, contractKey: string): boolean {
    return checkpointData[contractKey] !== undefined;
}

function saveCheckpoint(checkpointFilePath: string, checkpointData: any) {
    fs.writeFileSync(checkpointFilePath, JSON.stringify(checkpointData, null, 2), 'utf8');
}

async function verifyContract(address: string, constructorArguments: any[], isUpgradeable: boolean) {
    try {
        if (isUpgradeable) {
            const implementationAddress = await upgrades.erc1967.getImplementationAddress(address);
            console.log(`Verifying upgradeable contract implementation at: ${implementationAddress}`);
            await run("verify:verify", {
                address: implementationAddress,
                constructorArguments: [],
                forceConstructorArgs: true
            });
        }

        console.log(`Verifying proxy contract at: ${address}`);
        await run("verify:verify", {
            address,
            constructorArguments,
            forceConstructorArgs: true
        });
        console.log(`Successfully verified contract at: ${address}`);
    } catch (error) {
        console.error(`Failed to verify contract at ${address}:`, error);
    }
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);

    const checkpointFilePath = path.join(__dirname, '../../../../deployment_checkpoint_sepolia.json');

    if (!fs.existsSync(checkpointFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointFilePath}`);
    }

    const checkpointData = JSON.parse(fs.readFileSync(checkpointFilePath, 'utf8'));

    const lzCrossChainBridgeAddress = checkpointData.LZCrossChainBridge;
    if (!lzCrossChainBridgeAddress) {
        throw new Error('LZCrossChainBridge address not found in deployment_checkpoint_sepolia.json');
    }

    // Deploy TransactionStorage if not already deployed
    if (!isContractDeployed(checkpointData, "TransactionStorage")) {
        console.log("Deploying TransactionStorage...");
        const TransactionStorage = await ethers.getContractFactory("TransactionStorage");
        const transactionStorage = await TransactionStorage.deploy(deployer.address);
        await transactionStorage.waitForDeployment();
        const transactionStorageAddress = await transactionStorage.getAddress();
        console.log(`TransactionStorage deployed at: ${transactionStorageAddress}`);

        checkpointData.TransactionStorage = transactionStorageAddress;
        saveCheckpoint(checkpointFilePath, checkpointData);

        await verifyContract(transactionStorageAddress, [deployer.address], false);
    }

    // Deploy Rebalancer as an upgradeable proxy
    if (!isContractDeployed(checkpointData, "Rebalancer")) {
        console.log("Deploying Rebalancer as an upgradeable proxy...");
        const Rebalancer = await ethers.getContractFactory("Rebalancer");
        const rebalancer = await upgrades.deployProxy(
            Rebalancer,
            [
                deployer.address,             // _inETHAddress
                deployer.address,             // _lockbox
                deployer.address,             // _liqPool
                checkpointData.TransactionStorage, // _transactionStorage
                deployer.address,             // _ratioFeed
                deployer.address              // _operator
            ],
            { initializer: 'initialize' }
        );
        await rebalancer.waitForDeployment();
        const rebalancerAddress = await rebalancer.getAddress();
        console.log(`Rebalancer deployed at: ${rebalancerAddress}`);

        checkpointData.Rebalancer = rebalancerAddress;
        saveCheckpoint(checkpointFilePath, checkpointData);

        await verifyContract(rebalancerAddress, [], true);
    }

    // Deploy CrossChainAdapterL1 as an upgradeable proxy if not already deployed
    if (!isContractDeployed(checkpointData, "CrossChainAdapterL1")) {
        console.log("Deploying CrossChainAdapterL1...");
        const CrossChainAdapterL1 = await ethers.getContractFactory("CrossChainAdapterL1");
        const crossChainAdapterL1 = await upgrades.deployProxy(
            CrossChainAdapterL1,
            [
                lzCrossChainBridgeAddress,
                checkpointData.Rebalancer,
                checkpointData.TransactionStorage
            ],
            { initializer: 'initialize' }
        );
        await crossChainAdapterL1.waitForDeployment();
        const crossChainAdapterL1Address = await crossChainAdapterL1.getAddress();
        console.log(`CrossChainAdapterL1 deployed at: ${crossChainAdapterL1Address}`);

        checkpointData.CrossChainAdapterL1 = crossChainAdapterL1Address;
        saveCheckpoint(checkpointFilePath, checkpointData);

        await verifyContract(crossChainAdapterL1Address, [lzCrossChainBridgeAddress, checkpointData.Rebalancer, checkpointData.TransactionStorage], true);
    }

    const lzCrossChainBridge = await ethers.getContractAt("ICrossChainBridge", lzCrossChainBridgeAddress);
    const setAdapterTx = await lzCrossChainBridge.setAdapter(checkpointData.CrossChainAdapterL1);
    await setAdapterTx.wait();
    console.log(`Adapter set in LZCrossChainBridge to: ${checkpointData.CrossChainAdapterL1}`);

    const transactionStorage = await ethers.getContractAt("TransactionStorage", checkpointData.TransactionStorage);
    console.log("Adding Chain IDs to TransactionStorage...");
    await transactionStorage.addChainId(40161);
    await transactionStorage.addChainId(40231);
    await transactionStorage.addChainId(40232);
    console.log("Chain IDs added to TransactionStorage");

    await transactionStorage.setAdapter(checkpointData.CrossChainAdapterL1);
    console.log("Adapter added to TransactionStorage");

    console.log("Deployment and linking process completed successfully.");
}

// Run the script
main().catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
});

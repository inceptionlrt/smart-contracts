import { ethers, upgrades, run } from "hardhat";
import fs from "fs";
import path from "path";

// Utility function to check if a contract is already deployed and stored in the checkpoint
function isContractDeployed(checkpointData: any, contractKey: string): boolean {
    return checkpointData[contractKey] !== undefined;
}

// Utility function to write the checkpoint data back to the JSON file
function saveCheckpoint(checkpointFilePath: string, checkpointData: any) {
    fs.writeFileSync(checkpointFilePath, JSON.stringify(checkpointData, null, 2), 'utf8');
}

// Utility function to verify the contract on Etherscan
async function verifyContract(address: string, constructorArguments: any[], isUpgradeable: boolean) {
    try {
        // Verify the implementation if upgradeable
        if (isUpgradeable) {
            const implementationAddress = await upgrades.erc1967.getImplementationAddress(address);
            console.log(`Verifying upgradeable contract implementation at: ${implementationAddress}`);
            await run("verify:verify", {
                address: implementationAddress,
                constructorArguments: [],
                forceConstructorArgs: true // Force verification of the constructor
            });
        }

        // Verify the proxy contract
        console.log(`Verifying proxy contract at: ${address}`);
        await run("verify:verify", {
            address,
            constructorArguments,
            forceConstructorArgs: true // Force verification of the proxy
        });
        console.log(`Successfully verified contract at: ${address}`);
    } catch (error) {
        console.error(`Failed to verify contract at ${address}:`, error);
    }
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);

    // Path to deployment checkpoint JSON
    const checkpointFilePath = path.join(__dirname, '../../../../deployment_checkpoint_sepolia.json');

    // Check if deployment checkpoint file exists
    if (!fs.existsSync(checkpointFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointFilePath}`);
    }

    // Read and parse the JSON file
    const checkpointData = JSON.parse(fs.readFileSync(checkpointFilePath, 'utf8'));

    // Retrieve LZCrossChainBridge address
    const lzCrossChainBridgeAddress = checkpointData.LZCrossChainBridge;
    if (!lzCrossChainBridgeAddress) {
        throw new Error('LZCrossChainBridge address not found in deployment_checkpoint_sepolia.json');
    }

    if (!isContractDeployed(checkpointData, "DummyRebalancer")) {
        console.log("Deploying DummyRebalancer...");
        const DummyRebalancer = await ethers.getContractFactory("DummyRebalancer");
        const dummyRebalancer = await DummyRebalancer.deploy();
        await dummyRebalancer.waitForDeployment();
        const dummyRebalancerAddress = await dummyRebalancer.getAddress();
        console.log(`DummyRebalancer deployed at: ${dummyRebalancerAddress}`);

        // Save DummyRebalancer address to checkpoint
        checkpointData.DummyRebalancer = dummyRebalancerAddress;
        saveCheckpoint(checkpointFilePath, checkpointData);

        // Verify DummyRebalancer as a non-upgradeable contract
        await verifyContract(dummyRebalancerAddress, [], false);
    } else {
        console.log(`Skipping DummyRebalancer deployment, already deployed at: ${checkpointData.DummyRebalancer}`);
        await verifyContract(checkpointData.DummyRebalancer, [], false);
    }

    // Deploy TransactionStorage contract if not already deployed (non-upgradeable)
    if (!isContractDeployed(checkpointData, "TransactionStorage")) {
        console.log("Deploying TransactionStorage...");
        const TransactionStorage = await ethers.getContractFactory("TransactionStorage");
        const transactionStorage = await TransactionStorage.deploy(deployer.address);
        await transactionStorage.waitForDeployment();
        const transactionStorageAddress = await transactionStorage.getAddress();
        console.log(`TransactionStorage deployed at: ${transactionStorageAddress}`);

        // Save TransactionStorage address to checkpoint
        checkpointData.TransactionStorage = transactionStorageAddress;
        saveCheckpoint(checkpointFilePath, checkpointData);

        // Verify TransactionStorage as a non-upgradeable contract
        await verifyContract(transactionStorageAddress, [deployer.address], false);
    } else {
        console.log(`Skipping TransactionStorage deployment, already deployed at: ${checkpointData.TransactionStorage}`);
        // Still attempt verification
        await verifyContract(checkpointData.TransactionStorage, [deployer.address], false);
    }

    // Deploy CrossChainAdapterL1 as an upgradeable proxy if not already deployed
    if (!isContractDeployed(checkpointData, "CrossChainAdapterL1")) {
        console.log("Deploying CrossChainAdapterL1...");
        const CrossChainAdapterL1 = await ethers.getContractFactory("CrossChainAdapterL1");
        const crossChainAdapterL1 = await upgrades.deployProxy(
            CrossChainAdapterL1,
            [
                lzCrossChainBridgeAddress,
                checkpointData.DummyRebalancer,
                checkpointData.TransactionStorage

            ],
            { initializer: 'initialize' }
        );
        await crossChainAdapterL1.waitForDeployment();

        const crossChainAdapterL1Address = await crossChainAdapterL1.getAddress();
        console.log(`CrossChainAdapterL1 deployed at: ${crossChainAdapterL1Address}`);

        // Save CrossChainAdapterL1 address to checkpoint
        checkpointData.CrossChainAdapterL1 = crossChainAdapterL1Address;
        saveCheckpoint(checkpointFilePath, checkpointData);

        // Verify CrossChainAdapterL1 as an upgradeable contract
        await verifyContract(crossChainAdapterL1Address, [lzCrossChainBridgeAddress, checkpointData.DummyRebalancer, checkpointData.TransactionStorage], true);
    } else {
        console.log(`Skipping CrossChainAdapterL1 deployment, already deployed at: ${checkpointData.CrossChainAdapterL1}`);
        // Still attempt verification
        await verifyContract(checkpointData.CrossChainAdapterL1, [lzCrossChainBridgeAddress, checkpointData.DummyRebalancer, checkpointData.TransactionStorage], true);
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

    console.log("Adding Adapters to TransactionStorage...");
    await transactionStorage.addAdapter(40161, checkpointData.CrossChainAdapterL1);
    await transactionStorage.addAdapter(40231, checkpointData.CrossChainAdapterL1);
    await transactionStorage.addAdapter(40232, checkpointData.CrossChainAdapterL1);
    console.log("Adapters added to TransactionStorage");

    console.log("Deployment and linking process completed successfully.");
}

// Run the script
main().catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
});

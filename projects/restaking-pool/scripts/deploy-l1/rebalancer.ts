// scripts/deployRebalancer.js
import fs from "fs";
import { ethers, run, network, upgrades } from "hardhat";
import path from "path";

async function main(
    _inETHAddress,
    _lockbox,
    _liqPool,
    _ratioFeed,
    _operator
) {
    // Check if the deployment checkpoint file exists
    const checkpointPath = path.join(__dirname, '../../../../deployment_checkpoint_sepolia.json');
    if (!fs.existsSync(checkpointPath)) {
        console.error("Checkpoint file deployment_checkpoint_sepolia.json not found!");
        process.exit(1);
    }

    // Load contract addresses from the checkpoint file
    const checkpointData = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
    const lzCrossChainAdapterL1Address = checkpointData.LZCrossChainAdapterL1;
    if (!lzCrossChainAdapterL1Address) {
        console.error("LZCrossChainAdapterL1 address not found in deployment_checkpoint_sepolia.json!");
        process.exit(1);
    }

    // Deploy the Rebalancer contract as a Transparent Proxy upgradeable contract
    console.log("Deploying Rebalancer...");
    const Rebalancer = await ethers.getContractFactory("Rebalancer");
    const rebalancer = await upgrades.deployProxy(
        Rebalancer,
        [
            _inETHAddress,             // _inETHAddress
            _lockbox,                  // _lockbox
            _liqPool,                  // _liqPool
            lzCrossChainAdapterL1Address,  // _defaultAdapter from the checkpoint file
            _ratioFeed,                // _ratioFeed
            _operator                  // _operator
        ],
        { initializer: "initialize" }
    );
    await rebalancer.waitForDeployment();
    const rebalancerAddress = await rebalancer.getAddress();
    console.log("Rebalancer proxy deployed to:", rebalancerAddress);

    // Get the implementation address behind the proxy
    const rebalancerImplementationAddress = await upgrades.erc1967.getImplementationAddress(rebalancerAddress);
    console.log("Rebalancer implementation deployed to:", rebalancerImplementationAddress);

    // Attach to the existing LZCrossChainAdapterL1 contract
    const lzCrossChainAdapterL1 = await ethers.getContractAt("ILZCrossChainAdapterL1", lzCrossChainAdapterL1Address);
    console.log("Attached to LZCrossChainAdapterL1 at address:", lzCrossChainAdapterL1Address);

    // Call setTargetReceiver on the LZCrossChainAdapterL1 contract
    console.log("Setting target receiver...");
    const tx1 = await lzCrossChainAdapterL1.setTargetReceiver(rebalancerAddress);
    await tx1.wait();
    console.log("Target receiver set to Rebalancer address");

    // Call addChainId on Rebalancer with the specified chain ID
    console.log("Adding Chain ID 11155420 to Rebalancer...");
    const tx2 = await rebalancer.addChainId(11155420);
    await tx2.wait();
    console.log("Chain ID 11155420 added to Rebalancer");

    // Only verify the contract if on network ID 11155111
    if (network.config.chainId === 11155111) {
        await verifyContract(rebalancerAddress, []); // Verify Proxy
        await verifyContract(rebalancerImplementationAddress, [_inETHAddress, _lockbox, _liqPool, lzCrossChainAdapterL1Address, _ratioFeed, _operator]); // Verify Implementation
    } else {
        console.log(`Skipping verification on network ID ${network.config.chainId}`);
    }
}

// Verification function for contract
async function verifyContract(contractAddress, args) {
    try {
        console.log(`Verifying contract at address ${contractAddress} on Etherscan...`);
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
        console.log(`Contract at ${contractAddress} verified successfully.`);
    } catch (error) {
        console.error(`Verification failed for ${contractAddress}:`, error);
    }
}

// Execute the main function with dynamic arguments
(async () => {
    const _inETHAddress = `${process.env.DEPLOYER_ADDRESS}`; // replace with actual address
    const _lockbox = `${process.env.DEPLOYER_ADDRESS}`; // replace with actual address
    const _liqPool = `${process.env.DEPLOYER_ADDRESS}`; // replace with actual address
    const _ratioFeed = `${process.env.DEPLOYER_ADDRESS}`; // replace with actual address
    const _operator = (await ethers.getSigners())[0].address;

    await main(_inETHAddress, _lockbox, _liqPool, _ratioFeed, _operator)
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
})();

import { ethers } from "hardhat";
import * as fs from "fs";
import path from "path";

async function main() {
    // Load contract address from JSON file
    const checkpointPath = path.join(__dirname, '../../../../deployment_checkpoint_sepolia.json');
    const data = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
    const rebalancerAddress: string | undefined = data.Rebalancer;

    // Check if the address was found in JSON
    if (!rebalancerAddress) {
        throw new Error("Rebalancer address not found in JSON file.");
    }

    console.log(`Using Rebalancer contract at address: ${rebalancerAddress}`);

    // Connect to the Rebalancer contract
    const RebalancerFactory = await ethers.getContractFactory("Rebalancer");
    const rebalancer = RebalancerFactory.attach(rebalancerAddress) as Rebalancer;

    // Call updateTreasuryData() and wait for the transaction to be mined
    console.log("Calling updateTreasuryData on Rebalancer...");
    const tx = await rebalancer.updateTreasuryData();
    const receipt = await tx.wait();

    console.log("updateTreasuryData transaction confirmed!");
    console.log(`Transaction hash: ${receipt.transactionHash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

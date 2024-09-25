import { ethers } from "hardhat";

async function main() {
    // Get the ContractFactory for MockRebalancerL1
    const MockRebalancerL1 = await ethers.getContractFactory("MockRebalancerL1");

    // Deploy the contract
    console.log("Deploying MockRebalancerL1...");
    const mockRebalancer = await MockRebalancerL1.deploy();

    // Wait for the contract to be deployed
    await mockRebalancer.waitForDeployment();

    // Log the contract address
    const mockRebalancerAddress = await mockRebalancer.getAddress()
    console.log("MockRebalancerL1 deployed to:", mockRebalancerAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

import { ethers, run } from "hardhat";

async function main() {
    // Compile and get the contract factory
    const OptionsCreator = await ethers.getContractFactory("OptionsCreator");

    console.log("Deploying OptionsCreator contract...");

    // Deploy the contract
    const optionsCreator = await OptionsCreator.deploy();

    // Wait for the contract to be mined
    await optionsCreator.waitForDeployment();

    // Get the deployment transaction hash
    const txHash = optionsCreator.deployTransaction.hash;

    // Wait for 5 confirmations
    console.log("Waiting for 5 confirmations...");
    await ethers.provider.waitForTransaction(txHash, 5);

    console.log("OptionsCreator deployed to:", await optionsCreator.getAddress());

    // Verify the contract on Etherscan
    try {
        console.log("Waiting for Etherscan indexing...");
        await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 60 seconds to allow Etherscan to index

        console.log("Verifying OptionsCreator contract on Etherscan...");
        await run("verify:verify", {
            address: await optionsCreator.getAddress(),
            constructorArguments: [],
        });
        console.log("Contract verified successfully!");
    } catch (error) {
        console.error("Verification failed:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

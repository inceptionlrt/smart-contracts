import { ethers } from "hardhat";

async function main() {

    const l1TargetAddress = "0xC5E7565b9122B0fa6F7a3323de1fE867333D1b3F"; //NB! fill in the correct Rebalancer address

    // Get the ContractFactory for CrossChainAdapter
    const CrossChainAdapter = await ethers.getContractFactory("CrossChainAdapter");

    // Deploy the contract
    console.log("Deploying CrossChainAdapter...");
    const crossChainAdapter = await CrossChainAdapter.deploy(l1TargetAddress);

    // Wait for the contract to be deployed
    await crossChainAdapter.waitForDeployment();

    // Log the contract address
    const crossChainAdapterAddress = await crossChainAdapter.getAddress()
    console.log("CrossChainAdapter deployed to:", crossChainAdapterAddress);

    // Test values for sendAssetsInfoToL1
    const testTokensAmount = 1000;  // Example tokens amount
    const testEthAmount = 500;      // Example ETH amount

    // Call sendAssetsInfoToL1 with test values
    console.log(`Calling sendAssetsInfoToL1 with ${testTokensAmount} tokens and ${testEthAmount} ETH...`);
    const tx = await crossChainAdapter.sendAssetsInfoToL1(testTokensAmount, testEthAmount);
    const receipt = await tx.wait();

   // Query the logs using the new Ethers v6 event handling
    const eventLogs = await inceptionOmniVault.queryFilter(
        inceptionOmniVault.filters.AssetsInfoSentToL1(),
        receipt.blockNumber,
        receipt.blockNumber
    );

    // Iterate over the found logs and extract relevant event data
    if (eventLogs.length > 0) {
        for (const event of eventLogs) {
            const ticketId = event.args?.ticketId;
            console.log(`Assets info sent to L1 with ticketId: ${ticketId.toString()}`);
        }
    } else {
        console.log("AssetsInfoSentToL1 event not found in the transaction receipt.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

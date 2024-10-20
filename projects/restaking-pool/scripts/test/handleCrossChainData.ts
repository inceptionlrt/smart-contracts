import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    // Path to the deployment checkpoint JSON file
    const checkpointFilePath = path.join(__dirname, "../../../../deployment_checkpoint_sepolia.json");

    // Ensure the deployment checkpoint file exists
    if (!fs.existsSync(checkpointFilePath)) {
        throw new Error(`Checkpoint file not found: ${checkpointFilePath}`);
    }

    const checkpointData = JSON.parse(fs.readFileSync(checkpointFilePath, "utf8"));

    const crossChainAdapterL1Address = checkpointData.CrossChainAdapterL1;
    // const crossChainAdapterL1Address = "0xf2be8fdD5c171774D95aa3c81312535499a87b63";
    if (!crossChainAdapterL1Address) {
        throw new Error("CrossChainAdapterL1 address not found in deployment_checkpoint_sepolia.json");
    }

    console.log(`CrossChainAdapterL1 fetched for address: ${crossChainAdapterL1Address}`);

    // Get the CrossChainAdapterL1 contract instance
    const CrossChainAdapterL1 = await ethers.getContractAt("CrossChainAdapterL1", crossChainAdapterL1Address);

    try {
        // Check the current crosschainBridge address
        const crossChainBridge = await CrossChainAdapterL1.getCrosschainBridge();
        console.log(`CrossChainBridge is set to: ${crossChainBridge}`);
    } catch (error) {
        console.error("Error fetching crosschainBridge:", error);
        return;
    }

    // const ownerAddress = await CrossChainAdapterL1.owner();
    // if (ownerAddress.toLowerCase() !== deployer.address.toLowerCase()) {
    //     console.error("You are not the owner");
    // }


    // try {
    //     const transactionStorage = await CrossChainAdapterL1.transactionStorage();
    //     console.log(`TransactionStorage is set to: ${transactionStorage}`);
    // } catch (error) {
    //     console.error("Error fetching transactionStorage:", error);
    //     return;
    // }

    const chainId = 11155111n;
    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    const balance = ethers.parseUnits("10", 18);
    const totalSupply = ethers.parseUnits("1000", 18);

    const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [timestamp, balance, totalSupply]
    );

    console.log(payload);


    // const params = {
    //     timestamp: BigInt(Math.floor(Date.now() / 1000)),
    //     balance: ethers.parseUnits("10", 18),
    //     totalSupply: ethers.parseUnits("1000", 18)
    // }

    // const payload = ethers.AbiCoder.defaultAbiCoder().encode(
    //     ["(uint256,uint256,uint256)"],
    //     [Object.values(params)]
    // );

    /*
Resolve it from an object and a method signature with parameter names:

        encodedResolverOptions = defaultAbiCoder.encode(
        ["(bytes path,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,address inputTokenAddress,address destinationAddress,address targetAddress)"],
        [resolverOptions]
        );

    */

    try {
        // Call the handleCrossChainData function on the CrossChainAdapterL1 contract
        const tx = await CrossChainAdapterL1.handleCrossChainData(chainId, payload);
        await tx.wait();
        console.log(`handleCrossChainData called successfully. Tx hash: ${tx.hash}`);
    } catch (error) {
        console.error("Error calling handleCrossChainData:", error);
    }
}

// Run the script
main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});

// updateRatio.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // Load addresses from the JSON file
    const jsonPath = path.join(__dirname, "../../../deployment_checkpoint_arbitrum-sepolia.json"); // adjust path as necessary
    const addresses = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

    const inceptionRatioFeedAddress = addresses["InceptionRatioFeed"];
    const inceptionTokenAddress = addresses["InceptionToken"];

    if (!inceptionRatioFeedAddress || !inceptionTokenAddress) {
        console.error("Error: InceptionRatioFeed or InceptionToken address missing in JSON file.");
        process.exit(1);
    }

    console.log(`Using InceptionRatioFeed at ${inceptionRatioFeedAddress}`);
    console.log(`Updating ratio for InceptionToken at ${inceptionTokenAddress}`);

    // Connect to InceptionRatioFeed contract
    const InceptionRatioFeed = await hre.ethers.getContractFactory("InceptionRatioFeed");
    const inceptionRatioFeed = await InceptionRatioFeed.attach(inceptionRatioFeedAddress);

    // Define new ratio
    const newRatio = hre.ethers.utils.parseUnits("0.6", 18);

    // Execute updateRatioBatch function
    try {
        const tx = await inceptionRatioFeed.updateRatioBatch([inceptionTokenAddress], [newRatio]);
        console.log("Transaction sent. Waiting for confirmation...");
        await tx.wait();
        console.log(`Ratio for InceptionToken updated to ${newRatio.toString()} successfully.`);
    } catch (error) {
        console.error("Error updating ratio:", error);
    }
}

// Execute the main function
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

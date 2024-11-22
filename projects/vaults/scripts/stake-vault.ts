import { ethers } from "hardhat";
import * as fs from "fs";
import path from "path";

const checkpointPath = path.join(__dirname, '../../../deployment_checkpoint_optimism-sepolia.json');

async function main() {
    if (!fs.existsSync(checkpointPath)) {
        console.error("Deployment checkpoint file not found!");
        process.exit(1);
    }

    const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
    const inceptionOmniVaultAddress = checkpoint.InceptionOmniVault;
    const ratioFeedAddress = checkpoint.InceptionRatioFeed;

    if (!inceptionOmniVaultAddress || !ratioFeedAddress) {
        console.error("InceptionOmniVault or InceptionRatioFeed address is missing in checkpoint!");
        process.exit(1);
    }

    const [signer] = await ethers.getSigners();
    const inceptionOmniVault = await ethers.getContractAt("InceptionOmniVault", inceptionOmniVaultAddress, signer);

    try {
        // Check signer balance before deposit attempt
        const signerBalance = await ethers.provider.getBalance(signer.address);
        console.log("Signer balance:", ethers.formatEther(signerBalance), "ETH");

        if (signerBalance < ethers.parseEther("0.001")) {
            console.error("Insufficient balance for the deposit and gas fees. Please fund the account.");
            process.exit(1);
        }

        // Check if ratioFeed is set and set if necessary
        const currentRatioFeed = await inceptionOmniVault.ratioFeed();
        if (currentRatioFeed === ethers.ZeroAddress) {
            console.log("Setting ratioFeed on InceptionOmniVault...");
            const tx = await inceptionOmniVault.setRatioFeed(ratioFeedAddress);
            await tx.wait();
            console.log("ratioFeed set to:", ratioFeedAddress);
        }

        // Check depositBonusAmount
        const depositBonusAmount = await inceptionOmniVault.depositBonusAmount();
        console.log("Current depositBonusAmount:", ethers.formatUnits(depositBonusAmount, "ether"));

        // Set target capacity if needed
        const targetCapacity = await inceptionOmniVault.targetCapacity();
        const requiredCapacity = ethers.parseUnits("0.001", "ether");
        if (targetCapacity < requiredCapacity) {
            const tx = await inceptionOmniVault.setTargetFlashCapacity(requiredCapacity);
            await tx.wait();
            console.log(`Target capacity increased to: ${ethers.formatUnits(requiredCapacity, "ether")}`);
        } else {
            console.log("Target capacity is already sufficient.");
        }

        // Check current flash capacity
        const flashCapacityBefore = await inceptionOmniVault.getFlashCapacity();
        console.log("Initial Flash Capacity:", ethers.formatUnits(flashCapacityBefore, "ether"));

        // Adjust deposit amount if necessary
        const depositAmount = ethers.parseUnits("0.001", "ether");
        if (flashCapacityBefore >= depositAmount) {
            console.log(`Attempting to deposit ${ethers.formatUnits(depositAmount, "ether")} ETH to mint inception tokens...`);
            const tx = await inceptionOmniVault.deposit(signer.address, { value: depositAmount });
            await tx.wait();
            console.log("Deposit successful.");
        } else {
            console.log("Insufficient flash capacity for deposit. Ensure the vault has sufficient ETH or check target capacity.");
        }

    } catch (error) {
        console.error("Error interacting with the InceptionOmniVault contract:", error);
    }
}

main().catch((error) => {
    console.error("Error in script execution:", error);
    process.exit(1);
});

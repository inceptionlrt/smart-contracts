import { ethers } from "hardhat";
import * as fs from 'fs';
require("dotenv").config();

const CHECKPOINT_FILE = "deployment_checkpoint.json";

async function main() {
    const checkpoint = loadCheckpoint();

    if (!checkpoint.InceptionOmniVault || !checkpoint.CrossChainAdapterArbitrumL2) {
        throw new Error("InceptionOmniVault or CrossChainAdapter address not found in checkpoint.");
    }

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    const inceptionOmniVaultAddress = checkpoint.InceptionOmniVault;
    const crossChainAdapterAddress = checkpoint.CrossChainAdapterArbitrumL2;
    console.log(`InceptionOmniVault Address: ${inceptionOmniVaultAddress}`);
    console.log(`CrossChainAdapter Address: ${crossChainAdapterAddress}`);

    const InceptionOmniVault = await ethers.getContractAt(
        "InceptionOmniVault",
        inceptionOmniVaultAddress
    );

    const CrossChainAdapter = await ethers.getContractAt(
        "CrossChainAdapterArbitrumL2",
        crossChainAdapterAddress
    );

    console.log("Setting InceptionOmniVault as the vault in CrossChainAdapter...");
    const setVaultTx = await CrossChainAdapter.setVault(inceptionOmniVaultAddress);
    await setVaultTx.wait();
    console.log(`Vault set to InceptionOmniVault address: ${inceptionOmniVaultAddress}`);

    // Check the free balance in the vault
    let freeBalance = await InceptionOmniVault.getFreeBalance();
    console.log(`Free balance in InceptionOmniVault: ${ethers.formatEther(freeBalance)} ETH`);

    // If free balance is 0, deposit ETH into the vault via receive() method
    if (freeBalance === 0n) {
        console.log("No free balance available. Depositing ETH into the vault...");

        try {
            const depositAmount = ethers.parseEther("0.01");
            const depositTx = await deployer.sendTransaction({
                to: inceptionOmniVaultAddress,
                value: depositAmount
            });

            await depositTx.wait();
            console.log(`Deposited ${ethers.formatEther(depositAmount)} ETH into the vault.`);
        } catch (error) {
            console.error("Error during deposit:", error);
            return;
        }

        // Re-check free balance
        freeBalance = await InceptionOmniVault.getFreeBalance();
        console.log(`Updated free balance in InceptionOmniVault: ${ethers.formatEther(freeBalance)} ETH`);

        if (freeBalance === 0n) {
            console.log("Still no free balance after deposit. Exiting...");
            return;
        }
    }

    const gasData = [
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "uint256", "uint256"],
            [500000, 500000, ethers.toBigInt(20_000_000_000)]
        )
    ];

    console.log("Calling sendEthToL1 with gas data...");

    try {
        const tx = await InceptionOmniVault.sendEthToL1(gasData, {
            value: freeBalance
        });
        await tx.wait();
        console.log(`Transaction successful with hash: ${tx.hash}`);
    } catch (error: any) {
        console.error("Error during sendEthToL1:", error.message);

        const currentCrossChainAdapter = await InceptionOmniVault.crossChainAdapter();
        console.log(`CrossChainAdapter address: ${currentCrossChainAdapter}`);

        console.log(`Attempted to send callValue: ${ethers.formatEther(freeBalance)} ETH`);
    }
}

function loadCheckpoint(): any {
    if (fs.existsSync(CHECKPOINT_FILE)) {
        return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    }
    return {};
}

main().catch((error) => {
    console.error("Error in execution:", error);
    process.exitCode = 1;
});

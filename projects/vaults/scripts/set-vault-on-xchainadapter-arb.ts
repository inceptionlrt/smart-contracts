import { ethers } from "hardhat";
require("dotenv").config();

const CONTRACT_ADDRESS = "0xb12DE11AD9851433401F79Bf94275Ab4326018E4"; // CrossChainAdapterArbitrumL2 contract address
const VAULT_ADDRESS = "0xBfe050495637A2233165299EecdaB481F8fdE1F6"; // New vault address

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer Address: ${deployer.address}`);

    // Get the CrossChainAdapterArbitrumL2 contract instance
    const CrossChainAdapterArbitrumL2 = await ethers.getContractFactory("CrossChainAdapterArbitrumL2");
    const crossChainAdapter = CrossChainAdapterArbitrumL2.attach(CONTRACT_ADDRESS);

    // Call setVault function to set the vault address
    try {
        console.log(`Setting vault to address: ${VAULT_ADDRESS}`);
        const tx = await crossChainAdapter.setVault(VAULT_ADDRESS);
        await tx.wait(); // Wait for the transaction to be mined
        console.log(`Vault set successfully. Transaction Hash: ${tx.hash}`);
    } catch (error) {
        console.error(`Failed to set vault:`, error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

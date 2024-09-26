require("dotenv").config();
import { ethers, upgrades, network } from "hardhat";

async function main() {
    const networkName = network.name;
    console.log(`Deployment sequence initialized. Target network: ${networkName}.`);

    const l1TargetAddress = process.env.L1_TARGET_ADDRESS;
    const vaultAddress = process.env.VAULT_ADDRESS;

    console.log("🛠Pre-deployment diagnostic initiated...");

    // Sanity check 1: Ensure L1 target address and Vault address are set
    if (!l1TargetAddress || !vaultAddress) {
        console.error("⚠️Warning. L1_TARGET_ADDRESS and VAULT_ADDRESS must be set in the environment. Deployment aborted.");
        process.exit(1);
    }
    console.log("✅Environment variables validated. All systems nominal.");

    // Sanity check 2: Ensure correct network (Arbitrum L2)
    if (networkName !== "arbitrum" && networkName !== "arbitrum-goerli" && networkName !== "hardhat") {
        console.error("⚠️Error. Unsupported network detected. Please use Arbitrum Mainnet, Goerli, or Hardhat for local deployment. Deployment terminated.");
        process.exit(1);
    }
    console.log(`✅Network check complete. ${networkName} network is operational.`);

    // Deploy the CrossChainAdapterArbitrumL2 contract via proxy
    console.log("🚀Commencing contract deployment protocol...");

    const CrossChainAdapterArbitrumL2 = await ethers.getContractFactory("CrossChainAdapterArbitrumL2");

    // Deploy the proxy contract using OpenZeppelin's upgrades plugin
    const crossChainAdapter = await upgrades.deployProxy(CrossChainAdapterArbitrumL2, [l1TargetAddress, vaultAddress], {
        initializer: 'initialize',
    });

    // Wait for the deployment to be mined
    await crossChainAdapter.waitForDeployment();
    const crossChainAdapterAddress = await crossChainAdapter.getAddress();

    console.log(`✅Deployment successful. CrossChainAdapterArbitrumL2 deployed at coordinates: ${crossChainAdapterAddress}`);

    console.log("🎉Mission complete. CrossChainAdapterArbitrumL2 is now fully deployed and configured.");
}

main().catch((error) => {
    console.error("Critical error detected. Mission failure.");
    console.error(error);
    process.exit(1);
});

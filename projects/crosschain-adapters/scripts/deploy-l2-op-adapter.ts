require("dotenv").config();
import { ethers, upgrades, network } from "hardhat";

async function main() {
    // Set gas-related parameters
    const maxGasLimit = ethers.parseUnits("200000", "wei"); // Adjust if needed

    const networkName = network.name;
    console.log(`Deployment sequence initialized. Target network: ${networkName}.`);

    const l1TargetAddress = process.env.L1_TARGET_ADDRESS;
    const vaultAddress = process.env.VAULT_ADDRESS;
    const l2MessengerAddress = process.env.L2_MESSENGER_ADDRESS;
    const l2StandardBridgeAddress = process.env.L2_STANDARD_BRIDGE_ADDRESS;

    console.log("🛠Pre-deployment diagnostic initiated...");

    // Sanity check 1: Ensure L1 target, Vault, and required L2 addresses are set
    if (!l1TargetAddress || !vaultAddress || !l2MessengerAddress || !l2StandardBridgeAddress) {
        console.error("⚠️Warning. L1_TARGET_ADDRESS, VAULT_ADDRESS, L2_MESSENGER_ADDRESS, and L2_STANDARD_BRIDGE_ADDRESS must be set in the environment. Deployment aborted.");
        process.exit(1);
    }
    console.log("✅Environment variables validated. All systems nominal.");

    // Sanity check 2: Ensure correct network (Optimism L2)
    if (networkName !== "optimism" && networkName !== "optimism-goerli" && networkName !== "hardhat") {
        console.error("⚠️Error. Unsupported network detected. Please use Optimism Mainnet or Goerli. Deployment terminated.");
        process.exit(1);
    }
    console.log(`✅Network check complete. ${networkName} network is operational.`);

    // Deploy the CrossChainAdapterOptimismL2 contract
    console.log("🚀Commencing contract deployment protocol...");

    const CrossChainAdapterOptimismL2 = await ethers.getContractFactory("CrossChainAdapterOptimismL2");

    // Deploy the proxy contract using OpenZeppelin's upgrades plugin
    const crossChainAdapter = await upgrades.deployProxy(CrossChainAdapterOptimismL2, [
        l2MessengerAddress,
        l2StandardBridgeAddress,
        l1TargetAddress
    ], {
        initializer: 'initialize',
    });

    // No need to wait for deployment, you can directly get the address
    const crossChainAdapterAddress = await crossChainAdapter.getAddress();

    console.log(`✅Deployment successful. CrossChainAdapterOptimismL2 deployed at coordinates: ${crossChainAdapterAddress}.`);

    // Set the Vault address
    console.log("🔧Executing post-deployment configuration. Setting vault address...");

    const setVaultTx = await crossChainAdapter.setVault(vaultAddress);
    await setVaultTx.wait();
    console.log(`✅Vault address configuration complete. Vault address set to: ${vaultAddress}.`);

    console.log("🎉Mission complete. CrossChainAdapterOptimismL2 is now fully deployed and configured.");
}

main().catch((error) => {
    console.error("Critical error detected. Mission failure.");
    console.error(error);
    process.exit(1);
});

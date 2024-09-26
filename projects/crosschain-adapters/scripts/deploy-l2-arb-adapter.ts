require("dotenv").config();
import { ethers, upgrades, network } from "hardhat";

async function main() {
    const networkName = network.name;
    console.log(`Deployment sequence initialized. Target network: ${networkName}.`);

    // const l1TargetAddress = process.env.L1_TARGET_ADDRESS;
    const l1TargetAddress = "0x8308F3cf84683Cba5A11211be42D7C579dF7caAb";
    const vaultAddress = process.env.VAULT_ADDRESS;
    const deployer = (await ethers.getSigners())[0]; // Use the deployer as the owner

    console.log("🛠 Pre-deployment diagnostic initiated...");

    // Sanity check: Ensure L1 target address and Vault address are set
    if (!l1TargetAddress || !vaultAddress) {
        console.error("⚠️ L1_TARGET_ADDRESS and VAULT_ADDRESS must be set in the environment. Deployment aborted.");
        process.exit(1);
    }
    console.log("✅ Environment variables validated. All systems nominal.");

    // Sanity check: Ensure correct network
    if (networkName !== "arbitrum" && networkName !== "arbitrumSepolia" && networkName !== "hardhat") {
        console.error("⚠️ Unsupported network detected. Please use Arbitrum Mainnet, Sepolia, or Hardhat for local deployment.");
        process.exit(1);
    }
    console.log(`✅ Network check complete. ${networkName} network is operational.`);

    // Deploy the CrossChainAdapterArbitrumL2 contract via proxy
    console.log("🚀 Commencing contract deployment protocol...");

    const CrossChainAdapterArbitrumL2 = await ethers.getContractFactory("CrossChainAdapterArbitrumL2");

    // Deploy the proxy contract using OpenZeppelin's upgrades plugin
    const crossChainAdapter = await upgrades.deployProxy(CrossChainAdapterArbitrumL2, [l1TargetAddress, deployer.address], {
        initializer: 'initialize',
    });

    // Wait for the deployment to be mined
    await crossChainAdapter.waitForDeployment();
    const crossChainAdapterAddress = await crossChainAdapter.getAddress();

    console.log(`✅ Deployment successful. CrossChainAdapterArbitrumL2 deployed at: ${crossChainAdapterAddress}`);

    // Set the Vault address
    console.log("🔧 Executing post-deployment configuration. Setting vault address...");

    const setVaultTx = await crossChainAdapter.setVault(vaultAddress);
    await setVaultTx.wait();
    console.log(`✅ Vault address configuration complete. Vault address set to: ${vaultAddress}.`);

    // Impersonate vault address (this works on a local Hardhat fork or testnet with pre-configured accounts)
    console.log("💰 Funding the vault with ETH...");

    // Send some ETH to the vault from the deployer account
    const tx = await deployer.sendTransaction({
        to: vaultAddress,
        value: ethers.parseEther("1.0") // Send 1 ETH to the vault
    });
    await tx.wait();
    console.log(`✅ Vault funded with 1 ETH.`);

    console.log("💰 Sending a small amount of ETH to L1...");

    await ethers.provider.send("hardhat_impersonateAccount", [vaultAddress]);
    const vaultSigner = await ethers.getSigner(vaultAddress);

    // Call sendEthToL1 with only the _callValue (ETH value to send)
    const callValue = ethers.parseEther("0.01"); // The amount of ETH to send
    const sendEthTx = await crossChainAdapter.connect(vaultSigner).sendEthToL1(callValue, {
        value: callValue // Must match _callValue
    });
    await sendEthTx.wait();

    // Stop impersonating the vault
    await ethers.provider.send("hardhat_stopImpersonatingAccount", [vaultAddress]);

    console.log("✅ ETH sent to L1 successfully.");
    console.log("🎉 Mission complete. CrossChainAdapterArbitrumL2 is now fully deployed and configured.");
}

main().catch((error) => {
    console.error("Critical error detected. Mission failure.");
    console.error(error);
    process.exit(1);
});

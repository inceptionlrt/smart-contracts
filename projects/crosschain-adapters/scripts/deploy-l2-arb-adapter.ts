require("dotenv").config();
import { ethers, upgrades, network } from "hardhat";

async function main() {
    const networkName = network.name;
    console.log(`Deployment sequence initialized. Target network: ${networkName}.`);

    // const l1TargetAddress = process.env.L1_TARGET_ADDRESS;
    const l1TargetAddress = "0x8308F3cf84683Cba5A11211be42D7C579dF7caAb";
    const deployer = (await ethers.getSigners())[0]; // Use the deployer as the owner

    console.log("🛠 Pre-deployment diagnostic initiated...");

    // Sanity check: Ensure L1 target address is set
    if (!l1TargetAddress) {
        console.error("⚠️ L1_TARGET_ADDRESS must be set in the environment. Deployment aborted.");
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

    // Set the Vault address to the deployer's address
    console.log("🔧 Executing post-deployment configuration. Setting the deployer as the vault...");

    const setVaultTx = await crossChainAdapter.setVault(deployer.address);
    await setVaultTx.wait();
    console.log(`✅ Vault address configuration complete. Vault address set to: ${deployer.address}.`);

    // Send a small amount of ETH to L1 using the deployer's address
    console.log("💰 Sending a small amount of ETH to L1...");

    // Call sendEthToL1 with only the _callValue (ETH value to send)
    const callValue = ethers.parseEther("0.000001"); // The amount of ETH to send
    const gasData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [1000n, 100n, 100n]
    );
    // Call sendEthToL1 with _callValue (ETH value to send) and gasData as a bytes[] array
    const sendEthTx = await crossChainAdapter.sendEthToL1(0n, [gasData], {
        value: callValue // The amount of ETH to send
    });
    await sendEthTx.wait();


    console.log("✅ ETH sent to L1 successfully.");
    console.log("🎉 Mission complete. CrossChainAdapterArbitrumL2 is now fully deployed and configured.");
}

main().catch((error) => {
    console.error("Critical error detected. Mission failure.");
    console.error(error);
    process.exit(1);
});

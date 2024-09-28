require("dotenv").config();
import { ethers, upgrades, network } from "hardhat";

async function main() {
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
    if (networkName !== "optimism" && networkName !== "optimismSepolia" && networkName !== "hardhat") {
        console.error("⚠️Error. Unsupported network detected. Please use Optimism Mainnet or Sepolia. Deployment terminated.");
        process.exit(1);
    }
    console.log(`✅Network check complete. ${networkName} network is operational.`);

    // Deploy the CrossChainAdapterOptimismL2 contract
    console.log("🚀Commencing contract deployment protocol...");

    const CrossChainAdapterOptimismL2 = await ethers.getContractFactory("CrossChainAdapterOptimismL2");

    const operator = "0xaa082dAEDe284d1E4227EB81d342471f9F372F31";

    // Deploy the proxy contract using OpenZeppelin's upgrades plugin
    const crossChainAdapter = await upgrades.deployProxy(CrossChainAdapterOptimismL2, [
        l1TargetAddress,
        operator
    ], {
        initializer: 'initialize',
    });

    // No need to wait for deployment, you can directly get the address
    const crossChainAdapterAddress = await crossChainAdapter.getAddress();

    console.log(`✅Deployment successful. CrossChainAdapterOptimismL2 deployed at coordinates: ${crossChainAdapterAddress}.`);

    // Set the Vault address
    console.log("🔧Executing post-deployment configuration. Setting vault address...");

    const deployer = (await ethers.getSigners())[0];
    const setVaultTx = await crossChainAdapter.setVault(deployer.address);
    await setVaultTx.wait();
    console.log(`✅Vault address configuration complete. Vault address set to: ${vaultAddress}.`);

    // Call sendAssetsInfoToL1 on the deployed contract
    console.log("🔗Initiating call to sendAssetsInfoToL1...");

    const l1ReceiverAddress = "0x8308F3cf84683Cba5A11211be42D7C579dF7caAb";

    const bridgeAddress = await crossChainAdapter.l2StandardBridge();

    console.log(`bridgeAddress: ${bridgeAddress}`);

    // Correct function call with the address argument
    const gasData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint32"],
        [2_000_000n]
    );
    // Send transaction to L1
    const callValue = ethers.parseEther("0.000001"); // The amount of ETH to send
    const sendAssetsTx = await crossChainAdapter.sendEthToL1(callValue, [gasData], { value: callValue });

    await sendAssetsTx.wait(); // Wait for the transaction to be mined
    console.log(`✅sendAssetsInfoToL1 transaction successful. Data sent to: ${l1ReceiverAddress}.`);

    console.log("🎉Mission complete. CrossChainAdapterOptimismL2 is now fully deployed and configured.");
}

main().catch((error) => {
    console.error("Critical error detected. Mission failure.");
    console.error(error);
    process.exit(1);
});

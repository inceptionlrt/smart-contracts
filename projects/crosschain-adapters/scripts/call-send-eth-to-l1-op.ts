require("dotenv").config();
import { ethers, network } from "hardhat";

async function main() {
    const networkName = network.name;
    console.log(`🔗 Connecting to network: ${networkName}.`);

    // Ensure we're connected to the correct Optimism network
    if (networkName !== "optimism" && networkName !== "optimismSepolia" && networkName !== "hardhat") {
        console.error("⚠️ Error: Unsupported network. Please use Optimism Mainnet or Sepolia.");
        process.exit(1);
    }
    console.log(`✅ Network check complete. ${networkName} is active.`);

    const deployedContractAddress = "0xfcfa0856c6A6443e0B5Fd47049cCC03e9146b64f";

    const CrossChainAdapterOptimismL2 = await ethers.getContractFactory("CrossChainAdapterOptimismL2");
    const crossChainAdapter = CrossChainAdapterOptimismL2.attach(deployedContractAddress);

    console.log("🔗 Connected to CrossChainAdapterOptimismL2 at:", deployedContractAddress);

    console.log("🔗 Initiating call to sendAssetsInfoToL1...");

    const dummyValue = 0n;
    const gasData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [2000000n, 100n, 100n]
    );

    // Send transaction to L1
    const callValue = ethers.parseEther("0.000001"); // The amount of ETH to send
    const sendAssetsTx = await crossChainAdapter.sendEthToL1(dummyValue, [gasData], { value: callValue, gasLimit: 10_000_000n });

    // Wait for transaction to complete
    await sendAssetsTx.wait();
    console.log(`✅ sendAssetsInfoToL1 transaction successful.`);

    console.log("🎉 Mission complete. Transaction executed on Optimism L2.");
}

main().catch((error) => {
    console.error("Critical error detected.");
    console.error(error);
    process.exit(1);
});

import { ethers, network } from "hardhat";

async function main() {
    console.log("Setting target receiver for CrossChainAdapterL1...");

    const networkName = network.name;
    console.log(`Network: ${networkName}`);

    let nativeRebalancerAddress = "";
    let crossChainBridgeAddress = "";

    if (network.name === "mainnet") {
        // TODO
        nativeRebalancerAddress = "";
        crossChainBridgeAddress = "";
    } else if (network.name === "localhost") {
        nativeRebalancerAddress = ""; //TODO !!! paste NativeRebalancer address here!
        crossChainBridgeAddress = "0xA2c902810eAE3C24208580e043cA0de36Ae66c3E";
    } else {
        throw new Error(`Unknown network: ${network.name}`);
    }
    console.log("NativeRebalancer address:", nativeRebalancerAddress);
    console.log("crossChainBridge address:", crossChainBridgeAddress);

    const lzCrossChainAdapterL1 = await ethers.getContractAt("LZCrossChainAdapterL1", crossChainBridgeAddress);

    console.log(`Setting targetReceiver to NativeRebalancer address at ${nativeRebalancerAddress}`);
    const tx = await lzCrossChainAdapterL1.setTargetReceiver(nativeRebalancerAddress);

    await tx.wait();
    console.log("targetReceiver set successfully in transaction:", tx.hash);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying InceptionOmniVault:", error);
        process.exit(1);
    });

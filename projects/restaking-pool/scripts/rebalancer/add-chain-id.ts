import { ethers } from "hardhat";
import { NativeRebalancer } from "../../typechain-types";

async function main() {
    const nativeRebalancerAddress = "0xd13469584C26c329D56176b243f0507f84Fb778A";
    const chainIdToAdd = 11155420;

    console.log("Fetching signer...");
    const [signer] = await ethers.getSigners();
    console.log(`Using signer: ${signer.address}`);

    console.log(`Connecting to NativeRebalancer contract at: ${nativeRebalancerAddress}`);
    const nativeRebalancer: NativeRebalancer = await ethers.getContractAt(
        "NativeRebalancer",
        nativeRebalancerAddress,
        signer
    );

    console.log(`Calling addChainId with chain ID: ${chainIdToAdd}...`);
    const tx = await nativeRebalancer.addChainId(chainIdToAdd);
    console.log(`Transaction sent: ${tx.hash}`);

    console.log("Waiting for transaction to be mined...");
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt!.blockNumber}`);
    console.log(`addChainId(${chainIdToAdd}) call successful!`);
}

main().catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
});

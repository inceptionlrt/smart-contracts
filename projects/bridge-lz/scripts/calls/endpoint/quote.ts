import { ethers, network } from "hardhat";

async function main() {
    const lzCrossChainBridgeL2Address = "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17";
    const implementationAddress = "0x5A32B995BBea02339eD022a895fCC22b1d291A8E";

    const [signer] = await ethers.getSigners();

    const gas = 300_000;
    const value = 0;

    console.log("Compiling LZCrossChainAdapterL2 contract...");
    const LZCrossChainAdapterL2 = await ethers.getContractFactory("LZCrossChainAdapterL2");

    console.log("Deploying new implementation contract...");
    const newContract = await LZCrossChainAdapterL2.deploy();
    const deployTx = newContract.deploymentTransaction();
    if (!deployTx) {
        throw new Error("Failed to get deployment transaction.");
    }

    console.log("Waiting for deployment transaction to be mined...");
    await deployTx.wait();
    console.log(`New contract deployed at: ${newContract.target}`);

    console.log("Fetching deployed bytecode...");
    const newBytecode = await ethers.provider.getCode(newContract.target);

    console.log("Replacing bytecode of the proxy implementation...");
    await network.provider.send("hardhat_setCode", [implementationAddress, newBytecode]);
    console.log(`Bytecode at ${implementationAddress} replaced successfully.`);

    const updatedBytecode = await ethers.provider.getCode(implementationAddress);
    if (updatedBytecode === newBytecode) {
        console.log("Verification successful: Bytecode updated.");
    } else {
        console.error("Verification failed: Bytecode mismatch.");
        return;
    }

    const updatedLZCrossChainAdapterL2 = new ethers.Contract(
        lzCrossChainBridgeL2Address,
        LZCrossChainAdapterL2.interface,
        signer
    );


    //------------- CALLING THE SMART CONTRACT --------------------------------//

    console.log("Calling createLzReceiveOption...");
    const bytes = await updatedLZCrossChainAdapterL2.createLzReceiveOption(gas, value);
    console.log(`Bytes returned by createLzReceiveOption: ${bytes}`);

    console.log("Calling quoteSendEth...");
    const fees = await updatedLZCrossChainAdapterL2.quoteSendEth(17000n, bytes);
    console.log(`fees returned by quoteSendEth: ${ethers.formatUnits(fees, "ether")} ETH`);

}

main().catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
});

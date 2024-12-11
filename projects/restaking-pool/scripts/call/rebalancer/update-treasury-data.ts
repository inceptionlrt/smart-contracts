import { ethers, network } from "hardhat";
import { NativeRebalancer } from "../../../typechain-types";

async function main() {
    const rebalancerAddress = "0xd13469584C26c329D56176b243f0507f84Fb778A";
    const implementationAddress = "0x15C2AcADcBF3d06c592a3a192d64C3e329b6792E";

    console.log("Compiling NativeRebalancer contract...");
    const NativeRebalancerFactory = await ethers.getContractFactory("NativeRebalancer");

    console.log("Deploying new implementation contract...");
    const newContract = (await NativeRebalancerFactory.deploy()) as NativeRebalancer;
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

    // Use Typechain-typed NativeRebalancer instance
    const updatedNativeRebalancer = NativeRebalancerFactory.attach(
        rebalancerAddress
    ) as NativeRebalancer;

    //------------- CALLING THE SMART CONTRACT --------------------------------//

    console.log("Calling restake...");
    await updatedNativeRebalancer.stake(1n);
}

main().catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
});

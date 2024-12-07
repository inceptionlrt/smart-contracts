import { ethers, network } from "hardhat";

async function main() {
    const inceptionOmniVaultAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";
    const implementationAddress = "0x9F91f163A819A85923e9AA339afc8417a2960a85";
    const optionsCreatorAddress = "0x8149Df043F5376aa0E5e34A18171Da7Cc0212cF4";

    const [signer] = await ethers.getSigners();

    const gas = 300_000;
    const value = 0;

    console.log("Compiling InceptionOmniVault contract...");
    const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");

    const optionsCreator = new ethers.Contract(optionsCreatorAddress, [
        "function createLzReceiveOption(uint256 _gas, uint256 _value) public pure returns (bytes memory)"
    ], signer);

    console.log(`Creating LZ receive options with gas: ${gas}, value: ${value}`);
    const options = await optionsCreator.createLzReceiveOption(gas, value);
    console.log(`Generated options: ${options}`);

    console.log("Deploying new implementation contract...");
    const newContract = await InceptionOmniVault.deploy();
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

    const updatedInceptionOmniVault = new ethers.Contract(
        inceptionOmniVaultAddress,
        InceptionOmniVault.interface,
        signer
    );


    //------------- CALLING THE SMART CONTRACT --------------------------------//

    console.log("Calling quoteSendEthCrossChain...");
    const fees = await updatedInceptionOmniVault.quoteSendAssetsInfoToL1(options);
    console.log(`Fee returned by quoteSendEthCrossChain: ${ethers.formatUnits(fees, "ether")} ETH`);

    console.log("Calling sendAssetsInfoToL1...");
    const tx = await updatedInceptionOmniVault.sendAssetsInfoToL1(options, { value: fees });
    console.log(`Transaction sent: ${tx.hash}`);

}

main().catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
});

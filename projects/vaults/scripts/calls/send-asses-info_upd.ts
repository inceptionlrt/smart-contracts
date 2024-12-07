import { ethers, network } from "hardhat";

async function main() {
    const optionsCreatorAddress = "0x8149Df043F5376aa0E5e34A18171Da7Cc0212cF4";
    const inceptionOmniVaultAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";
    const implementationAddress = "0x9F91f163A819A85923e9AA339afc8417a2960a85";
    const proxyAdminAddress = "0x55D09ec6A155Fe71A04871bee9C1F8a0428240e2";

    const gas = 300_000;
    const value = 0;

    const [signer] = await ethers.getSigners();

    // Step 1: Replace Bytecode at Implementation Address
    console.log("Compiling InceptionOmniVault contract...");
    const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");
    const inceptionOmniVaultBytecode = InceptionOmniVault.bytecode;

    console.log(`Replacing bytecode at ${implementationAddress} with InceptionOmniVault's bytecode...`);
    await network.provider.send("hardhat_setCode", [implementationAddress, inceptionOmniVaultBytecode]);
    console.log(`Bytecode successfully replaced at ${implementationAddress}`);

    // Step 2: Update Proxy to Point to the Correct Implementation
    console.log(`Updating proxy at ${inceptionOmniVaultAddress} to use implementation at ${implementationAddress}...`);
    const proxyAdminAbi = [
        "function upgrade(address proxy, address implementation) external"
    ];
    const proxyAdmin = new ethers.Contract(proxyAdminAddress, proxyAdminAbi, signer);
    const tx = await proxyAdmin.upgrade(inceptionOmniVaultAddress, implementationAddress);
    console.log(`Transaction sent to update proxy implementation: ${tx.hash}`);
    await tx.wait();
    console.log(`Proxy implementation updated successfully`);

    // Step 3: Verify Proxy Points to Correct Implementation
    const proxyImplementation = await network.provider.send("eth_getStorageAt", [
        inceptionOmniVaultAddress,
        "0xb53127684a568b3173ae13b9fb7fd83f3c2c3a659624b86d3f0b08f3b4a60bba", // EIP-1967 implementation slot
        "latest"
    ]);
    const decodedImplementation = ethers.utils.getAddress(`0x${proxyImplementation.slice(-40)}`);
    if (decodedImplementation.toLowerCase() !== implementationAddress.toLowerCase()) {
        console.error(
            `Proxy implementation mismatch: expected ${implementationAddress}, found ${decodedImplementation}`
        );
        return;
    }
    console.log(`Proxy correctly points to implementation at: ${decodedImplementation}`);

    // Step 4: Create LZ Receive Options
    const optionsCreatorAbi = [
        "function createLzReceiveOption(uint256 _gas, uint256 _value) public pure returns (bytes memory)"
    ];
    const optionsCreator = new ethers.Contract(optionsCreatorAddress, optionsCreatorAbi, signer);

    console.log(`Creating LZ receive options with gas: ${gas}, value: ${value}`);
    const options = await optionsCreator.createLzReceiveOption(gas, value);
    console.log(`Generated options: ${options}`);

    // Step 5: Interact with InceptionOmniVault
    const inceptionOmniVaultAbi = [
        "function quoteSendAssetsInfoToL1(bytes memory _options) public view returns (uint256)",
        "function sendAssetsInfoToL1(bytes memory _options) external payable"
    ];
    const inceptionOmniVault = new ethers.Contract(inceptionOmniVaultAddress, inceptionOmniVaultAbi, signer);

    console.log(`Quoting fees for sending assets info to L1 with options: ${options}`);
    try {
        const fees = await inceptionOmniVault.quoteSendAssetsInfoToL1(options);
        console.log(`Estimated fees: ${ethers.utils.formatEther(fees)} ETH`);

        console.log(`Sending assets info to L1 with options and fees: ${ethers.utils.formatEther(fees)} ETH`);
        const tx = await inceptionOmniVault.sendAssetsInfoToL1(options, { value: fees });
        console.log(`Transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
    } catch (error) {
        console.error("Error during contract interaction:", error);
    }
}

main().catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
});

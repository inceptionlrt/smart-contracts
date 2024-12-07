import { ethers } from "hardhat";

async function main() {
    const optionsCreatorAddress = "0x8149Df043F5376aa0E5e34A18171Da7Cc0212cF4";
    const inceptionOmniVaultAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";

    const gas = 300_000;
    const value = 0;

    const [signer] = await ethers.getSigners();

    const optionsCreatorAbi = [
        "function createLzReceiveOption(uint256 _gas, uint256 _value) public pure returns (bytes memory)"
    ];
    const optionsCreator = new ethers.Contract(optionsCreatorAddress, optionsCreatorAbi, signer);

    console.log(`Creating LZ receive options with gas: ${gas}, value: ${value}`);
    const options = await optionsCreator.createLzReceiveOption(gas, value);
    console.log(`Generated options: ${options}`);

    const inceptionOmniVaultAbi = [
        "function quoteSendAssetsInfoToL1(bytes memory _options) public view returns (uint256)",
        "function sendAssetsInfoToL1(bytes memory _options) external payable"
    ];
    const inceptionOmniVault = new ethers.Contract(inceptionOmniVaultAddress, inceptionOmniVaultAbi, signer);

    console.log(`Quoting fees for sending assets info to L1 with options: ${options}`);
    const fees = await inceptionOmniVault.quoteSendAssetsInfoToL1(options);
    console.log(`Estimated fees: ${ethers.formatEther(fees)} ETH`);

    console.log(`Sending assets info to L1 with options and fees: ${ethers.formatEther(fees)} ETH`);
    const tx = await inceptionOmniVault.sendAssetsInfoToL1(options, { value: fees });
    console.log(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
}

main().catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
});

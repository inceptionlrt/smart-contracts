import { ethers } from "hardhat";

const LZ_CROSS_CHAIN_ADAPTER_L2_ADDRESS = "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17";
const OPTIONS_CREATOR_ADDRESS = "0x8149Df043F5376aa0E5e34A18171Da7Cc0212cF4";

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Using signer address:", await signer.getAddress());

    const tokensAmount = ethers.parseUnits("1000", 18); // TODO! Change this as needed
    const blockTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const ethAmount = 0;

    const LZCrossChainAdapterL2 = await ethers.getContractAt("LZCrossChainAdapterL2", LZ_CROSS_CHAIN_ADAPTER_L2_ADDRESS);
    const OptionsCreator = await ethers.getContractAt("OptionsCreator", OPTIONS_CREATOR_ADDRESS);

    const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [blockTimestamp, tokensAmount, ethAmount]
    );
    console.log("Encoded payload:", payload);

    const gas = 300000;
    const value = 0;
    const options = await OptionsCreator.createLzReceiveOption(gas, value);
    console.log("Created options:", options);

    console.log("Getting quote...");
    const msgValue = await LZCrossChainAdapterL2.quote(payload, options);
    console.log(`Quote (msg.value): ${ethers.formatEther(msgValue)} ETH`);

    console.log("Calling sendDataL1...");
    const tx = await LZCrossChainAdapterL2.sendDataL1(payload, options, { value: msgValue });
    console.log("Transaction hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
